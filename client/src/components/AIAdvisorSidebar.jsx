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
    Lightbulb,
    Target,
    BookOpen,
    TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

// Mentor-focused chat topics for guided conversation
const mentorChatTopics = {
    en: [
        {
            id: 'student_motivation',
            title: 'Student Motivation',
            description: 'How to keep students engaged and motivated',
            icon: TrendingUp,
            color: 'bg-blue-100 text-blue-600'
        },
        {
            id: 'school_selection_guidance',
            title: 'School Selection Guidance',
            description: 'Help students choose the right colleges',
            icon: School,
            color: 'bg-green-100 text-green-600'
        },
        {
            id: 'application_strategy',
            title: 'Application Strategy',
            description: 'Planning and organizing college applications',
            icon: Target,
            color: 'bg-purple-100 text-purple-600'
        },
        {
            id: 'essay_mentoring',
            title: 'Essay Mentoring',
            description: 'Guiding students through essay writing',
            icon: Edit,
            color: 'bg-orange-100 text-orange-600'
        },
        {
            id: 'interview_prep',
            title: 'Interview Preparation',
            description: 'Preparing students for college interviews',
            icon: Users,
            color: 'bg-pink-100 text-pink-600'
        },
        {
            id: 'timeline_management',
            title: 'Timeline Management',
            description: 'Helping students stay on track with deadlines',
            icon: BookOpen,
            color: 'bg-indigo-100 text-indigo-600'
        }
    ]
};

const AIAdvisorSidebar = ({ studentName, isCollapsed, onToggle, selectedStudent = null }) => {
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

    // Initialize welcome message with mentor context
    useEffect(() => {
        if (chatMessages.length === 0) {
            const studentContext = selectedStudent ?
                `I can see you're working with ${studentName}. I have their profile information and can provide specific guidance about their school choices, academic progress, and application strategy.` :
                `I'm here to help you provide effective mentoring guidance to your students.`;

            setChatMessages([
                {
                    role: 'ai',
                    content: `Hello! I'm your AI mentoring assistant designed specifically for college mentors. ${studentContext}

**I can help you with:**
• Reviewing student school choices and providing strategic advice
• Creating effective mentoring conversations
• Developing application timelines and strategies
• Guiding students through essay writing and interview prep
• Addressing student motivation and engagement challenges

Feel free to ask me anything or choose from the topics below to get started!`,
                    timestamp: new Date()
                }
            ]);
        }
    }, [studentName, selectedStudent]);

    const getStudentContext = () => {
        if (!selectedStudent) return '';

        return `Student: ${selectedStudent.first_name} ${selectedStudent.last_name}
Email: ${selectedStudent.email}
GPA: ${selectedStudent.gpa || 'Not specified'}
Year: ${selectedStudent.year_in_school || 'Not specified'}
School: ${selectedStudent.high_school || 'Not specified'}
Activities: ${selectedStudent.extracurricular_activities || 'Not specified'}
Outcomes: College admit: ${selectedStudent.college_admit ? 'Yes' : 'No'}, STEM major: ${selectedStudent.stem_major ? 'Yes' : 'No'}, Scholarship: ${selectedStudent.scholarship_awarded ? 'Yes' : 'No'}`;
    };

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
            const studentContext = getStudentContext();
            const response = await geminiService.getMentorChatResponse(message, studentContext);
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
                content: "I apologize, but I'm having trouble processing your request right now. As a mentoring tip, this might be a good time to rely on your own experience and intuition. Please try again in a moment.",
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
            const studentContext = getStudentContext();

            // Create mentor-focused prompt based on topic
            let mentorPrompt = '';
            switch (topic.id) {
                case 'student_motivation':
                    mentorPrompt = `How can I keep my student motivated throughout the college application process? ${selectedStudent ? `They seem to be struggling with staying engaged.` : 'What are some general strategies?'}`;
                    break;
                case 'school_selection_guidance':
                    mentorPrompt = `How should I guide my student in selecting the right colleges? ${selectedStudent ? `What should I consider about their profile and goals?` : 'What framework should I use?'}`;
                    break;
                case 'application_strategy':
                    mentorPrompt = `What's the best way to help my student organize their college applications? ${selectedStudent ? `How can I create a timeline that works for them?` : 'What are the key components?'}`;
                    break;
                case 'essay_mentoring':
                    mentorPrompt = `How can I effectively mentor my student through the essay writing process? ${selectedStudent ? `What approach works best for guiding them?` : 'What are the best practices?'}`;
                    break;
                case 'interview_prep':
                    mentorPrompt = `How should I prepare my student for college interviews? ${selectedStudent ? `What specific areas should we focus on?` : 'What are the key elements?'}`;
                    break;
                case 'timeline_management':
                    mentorPrompt = `How can I help my student stay organized with application deadlines? ${selectedStudent ? `What system would work best for them?` : 'What tools and strategies work well?'}`;
                    break;
                default:
                    mentorPrompt = topic.title;
            }

            const response = await geminiService.getMentorChatResponse(mentorPrompt, studentContext);
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
                content: `I'd be happy to help you with ${topic.title.toLowerCase()}! Here's some general guidance: Focus on building trust with your student, listen actively to their concerns, and provide structured support while encouraging their independence. Try asking your question again for more specific advice.`,
                timestamp: new Date()
            };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const resetChat = () => {
        const studentContext = selectedStudent ?
            `I can see you're working with ${studentName}. I have their profile information and can provide specific guidance about their school choices, academic progress, and application strategy.` :
            `I'm here to help you provide effective mentoring guidance to your students.`;

        setChatMessages([
            {
                role: 'ai',
                content: `Hello! I'm your AI mentoring assistant designed specifically for college mentors. ${studentContext}

**I can help you with:**
• Reviewing student school choices and providing strategic advice
• Creating effective mentoring conversations
• Developing application timelines and strategies
• Guiding students through essay writing and interview prep
• Addressing student motivation and engagement challenges

Feel free to ask me anything or choose from the topics below to get started!`,
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
                    title="Open AI Mentor Assistant"
                >
                    <Brain size={20} />
                </button>
                <div className="mt-4 text-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-2">
                        <Users size={14} className="text-indigo-600" />
                    </div>
                    <p className="text-xs text-gray-500 transform -rotate-90 whitespace-nowrap mt-8">AI Mentor</p>
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
                        <h3 className="font-semibold text-lg">AI Mentor Assistant</h3>
                        <p className="text-xs text-blue-100">Professional mentoring guidance</p>
                    </div>
                </div>
                <button
                    onClick={onToggle}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Student Context Bar */}
            {selectedStudent && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-2">
                            <span className="text-xs font-medium text-indigo-600">
                                {selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-800">Current Student: {studentName}</p>
                            <p className="text-xs text-gray-600">AI has their profile context</p>
                        </div>
                    </div>
                </div>
            )}

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
                                        <span className="text-xs font-medium text-gray-500">AI Mentor Assistant</span>
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
                                    <span className="text-sm text-gray-500">AI is analyzing...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mentor Topic Buttons */}
                    {showQuickTopics && (
                        <div className="space-y-3">
                            <div className="text-center">
                                <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
                                    <Users size={14} className="text-indigo-600 mr-1" />
                                    <span className="text-xs font-medium text-indigo-700">Mentoring Topics</span>
                                </div>
                            </div>
                            {mentorChatTopics.en.map((topic) => (
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
                        ← Back to Mentoring Topics
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
                        placeholder={selectedStudent ?
                            `Ask about ${studentName}'s college strategy...` :
                            "Ask me about mentoring strategies..."
                        }
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