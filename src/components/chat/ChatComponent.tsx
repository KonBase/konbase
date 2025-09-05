import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  InputAdornment,
} from '@mui/material';
import { Send, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { chatMessageSchema, ChatMessageFormData } from '@/lib/validations/schemas';
import { ChatMessage, Profile } from '@/types';

interface ChatComponentProps {
  associationId: string;
  currentUser: Profile;
}

export const ChatComponent: React.FC<ChatComponentProps> = ({
  associationId,
  currentUser,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChatMessageFormData>({
    resolver: zodResolver(chatMessageSchema),
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', associationId],
    queryFn: async () => {
      const response = await fetch(`/api/chat/messages?associationId=${associationId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const result = await response.json();
      return result.data as ChatMessage[];
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: ChatMessageFormData) => {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-association-id': associationId,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', associationId] });
      reset();
    },
  });

  const onSubmit = (data: ChatMessageFormData) => {
    if (data.message.trim()) {
      sendMessageMutation.mutate(data);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const isToday = now.toDateString() === messageDate.toDateString();
    
    if (isToday) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  return (
    <Paper sx={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Users size={20} />
          <Typography variant="h6">Association Chat</Typography>
        </Box>
      </Box>

      {/* Messages List */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <Typography>Loading messages...</Typography>
          </Box>
        ) : messages.length === 0 ? (
          <Box display="flex" justifyContent="center" p={2}>
            <Typography color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {messages.map((message, index) => {
              const isCurrentUser = message.sender_id === currentUser.id;
              const showDate = index === 0 || 
                new Date(messages[index - 1].created_at).toDateString() !== 
                new Date(message.created_at).toDateString();

              return (
                <React.Fragment key={message.id}>
                  {showDate && (
                    <Box sx={{ textAlign: 'center', py: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(message.created_at).toLocaleDateString([], {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Typography>
                    </Box>
                  )}
                  
                  <ListItem
                    sx={{
                      flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: isCurrentUser ? 0 : 40 }}>
                      <Avatar
                        src={message.sender?.avatar_url}
                        sx={{ 
                          width: 32, 
                          height: 32,
                          ml: isCurrentUser ? 1 : 0,
                          mr: isCurrentUser ? 0 : 1,
                        }}
                      >
                        {message.sender?.first_name?.[0]}{message.sender?.last_name?.[0]}
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      sx={{
                        textAlign: isCurrentUser ? 'right' : 'left',
                        '& .MuiListItemText-primary': {
                          backgroundColor: isCurrentUser ? 'primary.main' : 'grey.100',
                          color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
                          borderRadius: 2,
                          p: 1,
                          display: 'inline-block',
                          maxWidth: '70%',
                          wordBreak: 'break-word',
                        }
                      }}
                      primary={message.message}
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ textAlign: isCurrentUser ? 'right' : 'left' }}
                          >
                            {!isCurrentUser && `${message.sender?.first_name} • `}
                            {formatMessageTime(message.created_at)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>

      {/* Message Input */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            {...register('message')}
            fullWidth
            placeholder="Type a message..."
            variant="outlined"
            size="small"
            error={!!errors.message}
            helperText={errors.message?.message}
            disabled={sendMessageMutation.isPending}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="submit"
                    disabled={sendMessageMutation.isPending}
                    size="small"
                  >
                    <Send size={20} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </form>
      </Box>
    </Paper>
  );
};

export default ChatComponent;
