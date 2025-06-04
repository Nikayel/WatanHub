import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from '../services/ApiService';
import {
    MessageSquare,
    X,
    ChevronRight,
    HelpCircle,
    School,
    FileText,
    CheckCircle,
    Edit,
    Users,
    Loader,
    Sparkles,
    Brain,
    Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';

// Chat topics for guided conversation
const chatTopics = {
    en: [
        {
            id: 'school_types',
            title: 'School Types',
            description: 'Learn about target, safety, and stretch schools',
            icon: School,
            color: 'bg-blue-100 text-blue-600'
        },
        {
            id: 'application_tips',
            title: 'Application Tips',
            description: 'General advice for college applications',
            icon: FileText,
            color: 'bg-green-100 text-green-600'
        },
        {
            id: 'school_selection',
            title: 'School Selection',
            description: 'How to choose the right schools',
            icon: CheckCircle,
            color: 'bg-purple-100 text-purple-600'
        },
        {
            id: 'essays',
            title: 'Essay Writing',
            description: 'Tips for compelling essays',
            icon: Edit,
            color: 'bg-orange-100 text-orange-600'
        },
        {
            id: 'interviews',
            title: 'Interview Prep',
            description: 'College interview preparation',
            icon: Users,
            color: 'bg-pink-100 text-pink-600'
        }
    ]
};

const AIAdvisorSidebar = ({ studentName, isCollapsed, onToggle }) => {
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [showQuickTopics, setShowQuickTopics] = useState(true);
    const chatEndRef = useRef(null);

    // Auto scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages]);

    // Initialize welcome message
    useEffect(() => {
        if (chatMessages.length === 0) {
            setChatMessages([
                {
                    role: 'ai',
                    content: `Hello! I'm your AI college advisor. I can help you understand ${studentName ? `${studentName}'s` : 'your student\'s'} school choices, application strategies, and provide guidance on the college application process.\n\nFeel free to ask me anything or choose from the topics below to get started!`,
                    timestamp: new Date()
                }
            ]);
        }
    }, [studentName]);

    const sendMessage = async () => {
        const message = chatInput.trim();
        if (!message) return;

        // Add user message
        const userMessage = {
            role: 'user',
            content: message,
            timestamp: new Date()
        };

        setChatMessages(prev => [...prev, userMessage]);
        setChatInput('');
        setIsChatLoading(true);
        setShowQuickTopics(false);

        try {
            const response = await geminiService.getSchoolChatResponse(message);
            const aiMessage = {
                role: 'ai',
                content: response,
                timestamp: new Date()
            };
            setChatMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error getting AI response:', error);
            const errorMessage = {
                role: 'ai',
                content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
                timestamp: new Date()
            };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleTopicClick = async (topic) => {
        setSelectedTopic(topic.id);
        setShowQuickTopics(false);

        // Add user message
        const userMessage = {
            role: 'user',
            content: topic.title,
            timestamp: new Date()
        };

        setChatMessages(prev => [...prev, userMessage]);
        setIsChatLoading(true);

        try {
            const response = await geminiService.getSchoolChatResponse(topic.title);
            const aiMessage = {
                role: 'ai',
                content: response,
                timestamp: new Date()
            };
            setChatMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error getting AI response for topic:', error);
            const errorMessage = {
                role: 'ai',
                content: `I'd be happy to help you with ${topic.title.toLowerCase()}! Unfortunately, I'm having some connection issues right now. Please try asking your question again.`,
                timestamp: new Date()
            };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const resetChat = () => {
        setChatMessages([
            {
                role: 'ai',
                content: `Hello! I'm your AI college advisor. I can help you understand ${studentName ? `${studentName}'s` : 'your student\'s'} school choices, application strategies, and provide guidance on the college application process.\n\nFeel free to ask me anything or choose from the topics below to get started!`,
                timestamp: new Date()
            }
        ]);
        setSelectedTopic(null);
        setShowQuickTopics(true);
        setChatInput('');
    };

    if (isCollapsed) {
        return (
            <div className="w-16 bg-white border-r border-gray-200 shadow-lg flex flex-col items-center py-4">
                <button
                    onClick={onToggle}
                    className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    title="Open AI Advisor"
                >
                    <Brain size={20} />
                </button>
                <div className="mt-4 text-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-2">
                        <Sparkles size={14} className="text-indigo-600" />
                    </div>
                    <p className="text-xs text-gray-500 transform -rotate-90 whitespace-nowrap mt-8">AI Advisor</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-80 bg-white border-r border-gray-200 shadow-lg flex flex-col h-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-3">
                        <Brain size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">AI College Advisor</h3>
                        <p className="text-xs text-blue-100">Powered by advanced AI</p>
                    </div>
                </div>
                <button
                    onClick={onToggle}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
                <div className="space-y-4">
                    {chatMessages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${message.role === 'user'
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                                    : 'bg-white border border-gray-200 text-gray-800'
                                    }`}
                            >
                                {message.role === 'ai' && (
                                    <div className="flex items-center mb-2">
                                        <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mr-2">
                                            <Brain size={12} className="text-indigo-600" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">AI Advisor</span>
                                    </div>
                                )}
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                    {message.content}
                                </p>
                                <div className="text-xs text-gray-400 mt-2">
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* AI Typing Indicator */}
                    {isChatLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
                                <div className="flex items-center">
                                    <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mr-2">
                                        <Loader size={12} className="text-indigo-600 animate-spin" />
                                    </div>
                                    <span className="text-sm text-gray-500">AI is thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Topic Buttons */}
                    {showQuickTopics && (
                        <div className="space-y-3">
                            <div className="text-center">
                                <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
                                    <Lightbulb size={14} className="text-indigo-600 mr-1" />
                                    <span className="text-xs font-medium text-indigo-700">Quick Topics</span>
                                </div>
                            </div>
                            {chatTopics.en.map((topic) => (
                                <button
                                    key={topic.id}
                                    onClick={() => handleTopicClick(topic)}
                                    className="w-full text-left p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 transform hover:scale-[1.02] group"
                                >
                                    <div className="flex items-center">
                                        <div className={`p-2 rounded-lg ${topic.color} mr-3 group-hover:scale-110 transition-transform`}>
                                            <topic.icon size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800 text-sm">{topic.title}</p>
                                            <p className="text-xs text-gray-500">{topic.description}</p>
                                        </div>
                                        <ChevronRight size={14} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white">
                {!showQuickTopics && (
                    <button
                        onClick={resetChat}
                        className="w-full mb-3 px-3 py-2 text-xs text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                        ← Back to Topics
                    </button>
                )}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        placeholder="Ask me anything about college applications..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        disabled={isChatLoading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isChatLoading || !chatInput.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                    >
                        <MessageSquare size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAdvisorSidebar; 