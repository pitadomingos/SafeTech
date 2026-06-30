
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  type: 'SMS' | 'EMAIL';
  recipient: string;
  recipientName: string;
  subject?: string; // For Email
  content: string;
  status: 'Sent' | 'Failed' | 'Queued';
  timestamp: Date;
}

interface MessageContextType {
  messages: Message[];
  addMessage: (msg: Omit<Message, 'id' | 'timestamp' | 'status'>) => void;
  clearMessages: () => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

/**
 * INITIAL_MESSAGES covers the full spectrum of system communications:
 * 1. Booking Confirmation
 * 2. Expiry Warning
 * 3. Auto-Booking Alert (Critical)
 * 4. Result Notification (Passed)
 * 5. Result Notification (Failed)
 * 6. System Access Block (ASO/IoT)
 */
const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-6',
    type: 'SMS',
    recipient: '+258 84 900 1122',
    recipientName: 'Sarah Connor',
    content: 'CARS ACCESS ALERT: Your access has been BLOCKED at Gate 1 due to an expired ASO (Medical Certificate). Please report to the Medical Center and HSE office to update your records.',
    status: 'Sent',
    timestamp: new Date(Date.now() - 1800000) // 30 mins ago
  },
  {
    id: 'msg-1',
    type: 'SMS',
    recipient: '+258 84 123 4567',
    recipientName: 'Paulo Manjate',
    content: 'RACS SAFETY: Hi Paulo, you are booked for RAC 01 - Working at Height on 2024-06-15 at 08:00 in Room A. Please ensure you bring your safety harness for the practical evaluation.',
    status: 'Sent',
    timestamp: new Date(Date.now() - 3600000) // 1 hour ago
  },
  {
    id: 'msg-4',
    type: 'EMAIL',
    recipient: 'antonio.sitoe@cars-solutions.com',
    recipientName: 'Antonio Sitoe',
    subject: 'CONGRATULATIONS: Training Result - RAC 05',
    content: 'Dear Antonio Sitoe,\n\nWe are pleased to inform you that you have PASSED the RAC 05 - Confined Space training session conducted on 2024-06-10.\n\nYour digital passport has been updated. This certification is valid until 2026-06-10.\n\nTheory Score: 88%\nPractical Score: 92%\n\nKeep working safely,\nCARS Training Department',
    status: 'Sent',
    timestamp: new Date(Date.now() - 14400000) // 4 hours ago
  },
  {
    id: 'msg-3',
    type: 'SMS',
    recipient: '+258 82 999 8888',
    recipientName: 'Jose Cossa',
    content: 'CARS CRITICAL: Jose, you have been AUTO-BOOKED for RAC 11 - Mine Traffic Rules on 2024-06-20 to prevent a gate lockout (Expiry < 7 days). Session starts at 09:00 in the Simulator Room.',
    status: 'Sent',
    timestamp: new Date(Date.now() - 7200000) // 2 hours ago
  },
  {
    id: 'msg-2',
    type: 'EMAIL',
    recipient: 'maria.silva@cars-solutions.com',
    recipientName: 'Maria Silva',
    subject: 'EXPIRY WARNING: Safety Certification - RAC 01',
    content: 'Dear Maria Silva,\n\nOur system has identified that your certification for RAC 01 - Working at Height is set to expire on 2024-07-15.\n\nTo maintain your site access permissions without interruption, please log in to the CARS portal or visit the HSE office to book a renewal session before the expiry date.\n\nBest regards,\nCARS HSE Operations Team',
    status: 'Sent',
    timestamp: new Date(Date.now() - 86400000) // 1 day ago
  },
  {
    id: 'msg-5',
    type: 'SMS',
    recipient: '+258 84 555 6677',
    recipientName: 'Fernando Junior',
    content: 'RACS NOTIFICATION: Fernando, your results for RAC 02 are ready. Status: FAILED (Theory: 65%). Minimum pass mark is 70%. You have been queued for a retake session on 2024-06-25. Please study the mobile equipment lockout procedure.',
    status: 'Sent',
    timestamp: new Date(Date.now() - 172800000) // 2 days ago
  }
];

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp' | 'status'>) => {
    const newMessage: Message = {
      ...msg,
      id: uuidv4(),
      timestamp: new Date(),
      status: 'Sent'
    };
    setMessages(prev => [newMessage, ...prev]);
  };

  const clearMessages = () => setMessages([]);

  return (
    <MessageContext.Provider value={{ messages, addMessage, clearMessages }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};
