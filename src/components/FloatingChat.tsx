import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { Send, X, Minimize2, Maximize2, Bot, User, Loader2, GripHorizontal, Undo2, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamMessage, ChatMessage, AppTransformData } from '../lib/gemini';
import { saveToHistory } from '../lib/history';
import { cn } from '../lib/utils';
import { auth } from '../firebase';

interface FloatingChatProps {
  isPremium: boolean;
  onAppSelect?: (app: AppTransformData) => void;
  externalApp?: AppTransformData | null;
}

export function FloatingChat({ isPremium, onAppSelect, externalApp }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentApp, setCurrentApp] = useState<AppTransformData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'مرحباً! أنا "المتحول"، مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟ يمكنك طلب التحول إلى أي تطبيق تريده.',
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dragControls = useDragControls();

  useEffect(() => {
    if (externalApp) {
      setCurrentApp(externalApp);
      setIsOpen(true);
      setIsMinimized(false);
    }
  }, [externalApp]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const modelMessageId = (Date.now() + 1).toString();
    setMessages(prev => [
      ...prev,
      { id: modelMessageId, role: 'model', text: '', isStreaming: true }
    ]);

    try {
      const history = messages.filter(m => !m.error);
      const stream = streamMessage(userMessage.text, history);
      
      let fullResponse = '';
      let transformData: AppTransformData | undefined;

      for await (const chunk of stream) {
        if (chunk.type === 'text') {
          fullResponse += chunk.text;
          setMessages(prev => prev.map(msg => 
            msg.id === modelMessageId 
              ? { ...msg, text: fullResponse }
              : msg
          ));
        } else if (chunk.type === 'transform') {
          transformData = chunk.data;
          if (!fullResponse.trim() && transformData.messageToUser) {
            fullResponse = transformData.messageToUser;
          } else if (transformData.messageToUser) {
            fullResponse += `\n\n*${transformData.messageToUser}*`;
          }
          
          setMessages(prev => prev.map(msg => 
            msg.id === modelMessageId 
              ? { ...msg, text: fullResponse, transformData }
              : msg
          ));
          setCurrentApp(transformData);
          
          // Save to history
          const userId = auth.currentUser?.uid || '';
          await saveToHistory(userId, isPremium, transformData);
        }
      }
      
      setMessages(prev => prev.map(msg => 
        msg.id === modelMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ));
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === modelMessageId 
          ? { ...msg, text: 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.', isStreaming: false, error: true }
          : msg
      ));
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-50"
      >
        <Bot size={28} />
      </motion.button>
    );
  }

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.1}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={cn(
        "fixed z-50 flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800",
        isMinimized ? "w-80 h-16" : "w-[90vw] sm:w-[400px] md:w-[450px] h-[80vh] max-h-[800px]",
        "bottom-6 right-6 sm:bottom-auto sm:right-auto sm:top-20 sm:left-20"
      )}
    >
      {/* Header (Draggable Area) */}
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 cursor-move"
      >
        <div className="flex items-center gap-3 pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">المتحول</h3>
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              متصل
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <GripHorizontal size={16} className="mr-2 opacity-50 pointer-events-none" />
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isMinimized && !currentApp && (
          <motion.div 
            key="chat"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50 dark:bg-gray-900/50" dir="rtl">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    msg.role === 'user' ? "mr-auto flex-row-reverse" : "ml-auto"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1",
                    msg.role === 'user' 
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300" 
                      : "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                  )}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-blue-600 text-white rounded-tl-sm" 
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tr-sm shadow-sm border border-gray-100 dark:border-gray-700",
                    msg.error && "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                  )}>
                    {msg.role === 'model' ? (
                      <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
                        {msg.text ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.text}
                          </ReactMarkdown>
                        ) : (
                          <div className="flex items-center gap-1 h-5">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800" dir="rtl">
              <form 
                onSubmit={handleSubmit}
                className="relative flex items-end gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 border border-transparent focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اسأل المتحول..."
                  className="w-full max-h-32 min-h-[44px] bg-transparent border-none focus:ring-0 resize-none py-3 px-4 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500"
                  rows={1}
                  dir="auto"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="flex-shrink-0 w-10 h-10 mb-0.5 ml-0.5 rounded-xl bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 disabled:bg-gray-400 transition-colors hover:bg-blue-700"
                >
                  {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="mr-1" />}
                </button>
              </form>
              <div className="text-center mt-2">
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  المتحول يمكن أن يخطئ. يرجى التحقق من المعلومات المهمة.
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {!isMinimized && currentApp && (
          <motion.div 
            key="app"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col flex-1 overflow-hidden bg-white dark:bg-gray-900"
          >
            {/* App Header Bar */}
            <div className="flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800" dir="rtl">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setCurrentApp(null);
                    if (onAppSelect) onAppSelect(null as any);
                  }}
                  className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium px-2 py-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
                >
                  <Undo2 size={16} />
                  العودة للدردشة
                </button>
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">{currentApp.appName}</span>
            </div>

            {currentApp.isSimulation && (
              <div className="bg-red-500 text-white text-xs text-center py-1.5 font-medium flex items-center justify-center gap-1.5 shadow-inner" dir="rtl">
                <AlertTriangle size={14} />
                تنبيه: هذه واجهة محاكاة افتراضية للشكل فقط
              </div>
            )}

            <div className="flex-1 overflow-hidden relative bg-white">
              <iframe 
                srcDoc={currentApp.htmlCode}
                className="w-full h-full border-none absolute inset-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                title={currentApp.appName}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}



