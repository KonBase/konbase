import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Popover,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Chip,
  Button,
  Paper,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  MessageCircle,
  Send,
  MoreVertical,
  Users,
  Settings,
  Smile,
  Paperclip,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';

interface ChatMessage {
  id: string;
  content: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  created_at: string;
  edited_at?: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  association_id?: string;
  convention_id?: string;
}

interface ChatChannel {
  id: string;
  name: string;
  type: 'association' | 'convention' | 'direct';
  unread_count: number;
  last_message?: ChatMessage;
  participants: number;
}

export const ChatWidget: React.FC = () => {
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const { data: channelsData, refetch: refetchChannels } = useQuery({
    queryKey: ['chat-channels'],
    queryFn: async () => {
      const response = await fetch('/api/chat/channels', {
        headers: {
          'x-association-id': session?.user?.associations?.[0]?.association?.id || '',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch channels');
      const result = await response.json();
      return result.data;
    },
    enabled: !!session,
  });

  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ['chat-messages', selectedChannel],
    queryFn: async () => {
      if (!selectedChannel) return { messages: [] };
      
      const response = await fetch(`/api/chat/messages?channel=${selectedChannel}`, {
        headers: {
          'x-association-id': session?.user?.associations?.[0]?.association?.id || '',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      const result = await response.json();
      return result.data;
    },
    enabled: !!session && !!selectedChannel,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  useEffect(() => {
    if (channelsData) {
      setChannels(channelsData.channels || []);
    }
  }, [channelsData]);

  useEffect(() => {
    if (messagesData) {
      setMessages(messagesData.messages || []);
    }
  }, [messagesData]);

  // WebSocket connection for real-time chat
  useEffect(() => {
    if (!session?.user?.id || !selectedChannel) return;

    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/chat`);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('Chat WebSocket connected');
      // Join the selected channel
      ws.send(JSON.stringify({ 
        type: 'join', 
        channel: selectedChannel,
        userId: session.user.id,
        associationId: session.user.associations?.[0]?.association?.id 
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      } else if (data.type === 'typing') {
        // Handle typing indicators
        console.log(`${data.user} is typing...`);
      }
    };

    ws.onclose = () => {
      console.log('Chat WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [session?.user?.id, selectedChannel]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleChannelSelect = (channelId: string) => {
    setSelectedChannel(channelId);
    handleClose();
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChannel) return;

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-association-id': session?.user?.associations?.[0]?.association?.id || '',
        },
        body: JSON.stringify({
          channel_id: selectedChannel,
          content: message,
          message_type: 'text',
        }),
      });

      if (response.ok) {
        setMessage('');
        refetchMessages();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    if (wsRef.current && selectedChannel) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        channel: selectedChannel,
        userId: session?.user?.id,
      }));
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const selectedChannelData = channels.find(c => c.id === selectedChannel);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ position: 'relative' }}
      >
        <MessageCircle size={24} />
        {channels.some(c => c.unread_count > 0) && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'error.main',
            }}
          />
        )}
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 400, height: 500, display: 'flex', flexDirection: 'column' }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Chat</Typography>
            <Box>
              <IconButton size="small" onClick={() => setSettingsDialogOpen(true)}>
                <Settings size={16} />
              </IconButton>
              <IconButton size="small" onClick={() => setMenuAnchor(anchorEl)}>
                <MoreVertical size={16} />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {!selectedChannel ? (
          <Box sx={{ p: 2, flex: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select a Channel
            </Typography>
            <List>
              {channels.map((channel) => (
                <ListItem
                  key={channel.id}
                  component="button"
                  onClick={() => handleChannelSelect(channel.id)}
                  sx={{ 
                    borderRadius: 1, 
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <MessageCircle size={16} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="medium">
                          {channel.name}
                        </Typography>
                        {channel.unread_count > 0 && (
                          <Chip
                            label={channel.unread_count}
                            size="small"
                            color="error"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {channel.participants} participants
                        </Typography>
                        {channel.last_message && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {channel.last_message.content.substring(0, 50)}...
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Channel Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight="medium">
                  {selectedChannelData?.name}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Users size={16} />
                  <Typography variant="caption">
                    {selectedChannelData?.participants}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              <List>
                {messages.map((msg) => (
                  <ListItem key={msg.id} sx={{ alignItems: 'flex-start', py: 0.5 }}>
                    <ListItemAvatar>
                      <Avatar
                        src={msg.user_avatar}
                        sx={{ width: 32, height: 32 }}
                      >
                        {msg.user_name[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight="medium">
                            {msg.user_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(msg.created_at)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2">
                          {msg.content}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
                <div ref={messagesEndRef} />
              </List>
            </Box>

            {/* Message Input */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <TextField
                fullWidth
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                onInput={handleTyping}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small">
                        <Paperclip size={16} />
                      </IconButton>
                      <IconButton size="small">
                        <Smile size={16} />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                      >
                        <Send size={16} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Box>
          </Box>
        )}

        {/* Settings Dialog */}
        <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)}>
          <DialogTitle>Chat Settings</DialogTitle>
          <DialogContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <IconButton onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </IconButton>
              <Typography>
                {isMuted ? 'Unmute' : 'Mute'} notifications
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSettingsDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Popover>
    </>
  );
};

export default ChatWidget;
