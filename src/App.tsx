/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Search,
    MessageSquare,
    User as UserIcon,
    Home,
    Bell,
    MapPin,
    Star,
    ChevronRight,
    ArrowLeft,
    Camera,
    CheckCircle2,
    Clock,
    Calendar as CalendarIcon,
    Settings,
    LogOut,
    Briefcase,
    Smartphone,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Plus,
    Send,
    MoreVertical,
    Verified,
    Heart,
    Filter,
    ArrowLeftCircle,
    Check,
    Rocket,
    Grid,
    Droplets,
    Zap,
    Palette,
    Hammer,
    Wind,
    Sparkles,
    Sprout,
    Trash2
} from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { View, User, UserRole, Professional, Chat, Message as MessageType, PortfolioItem, Review } from './types';
import logo from './logo.png';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// Mock Data
const MOCK_REVIEWS_INITIAL: Review[] = [
    { id: 'r1', professionalId: 'pro1', userId: 'c1', userName: 'Maria Oliveira', rating: 5, comment: 'Trabalho impecável! O Carlos foi super pontual e a pintura ficou perfeita.', date: 'Há 2 dias', userAvatar: 'https://picsum.photos/seed/maria/100/100' },
    { id: 'r2', professionalId: 'pro1', userId: 'c2', userName: 'Ricardo Santos', rating: 4, comment: 'Muito bom profissional. Recomendo.', date: 'Há 1 semana', userAvatar: 'https://picsum.photos/seed/ricardo/100/100' },
    { id: 'r3', professionalId: 'pro1', userId: 'c3', userName: 'Ana Costa', rating: 5, comment: 'Excelente atendimento e qualidade.', date: 'Há 2 semanas', userAvatar: 'https://picsum.photos/seed/ana/100/100' },
];

const MOCK_PROS: Professional[] = [
    {
        id: 'pro1',
        name: 'Carlos Silva',
        email: 'carlos@eletrica.com',
        role: 'professional',
        workerType: 'professional',
        specialty: 'Eletricista Residencial',
        rating: 4.9,
        reviewsCount: 124,
        completedServices: 120,
        yearsExp: 8,
        responseTime: '15min',
        location: 'São Paulo, SP',
        bio: 'Especialista em instalações elétricas modernas, automação residencial e reparos urgentes. Atendimento focado em segurança e eficiência técnica com certificação NR10.',
        avatar: 'https://picsum.photos/seed/pro1/200/200',
        portfolio: [
            { id: '1', title: 'Quadro de Luz', imageUrl: 'https://picsum.photos/seed/work1/400/400' },
            { id: '2', title: 'Automação', imageUrl: 'https://picsum.photos/seed/work2/400/400' },
            { id: '3', title: 'Iluminação LED', imageUrl: 'https://picsum.photos/seed/work3/400/400' },
        ]
    },
    {
        id: 'pro2',
        name: 'Ana Oliveira',
        email: 'ana@design.com',
        role: 'professional',
        workerType: 'autonomous',
        specialty: 'Arquiteta & Designer',
        rating: 4.8,
        reviewsCount: 85,
        completedServices: 85,
        yearsExp: 5,
        responseTime: '30min',
        location: 'São Paulo, SP',
        bio: 'Arquiteta apaixonada por transformar espaços e criar ambientes que refletem a personalidade dos clientes. Experiência em design de interiores e reformas residenciais.',
        avatar: 'https://picsum.photos/seed/pro2/200/200',
        portfolio: []
    }
];

const MOCK_CHATS: Chat[] = [
    {
        id: 'chat1',
        participant: MOCK_PROS[0],
        lastMessage: 'asfas',
        timestamp: 'Agora',
        unreadCount: 2,
        online: true,
        messages: [
            { id: 'm1', senderId: 'pro1', text: 'Olá! Sou o Carlos Silva. Como posso te ajudar hoje?', timestamp: '09:15' },
            { id: 'm2', senderId: 'me', text: 'Olá! Gostaria de um orçamento para a pintura da minha sala de estar. Seria possível?', timestamp: '09:17' },
            { id: 'm3', senderId: 'me', text: 'asfas', timestamp: 'Agora' }
        ]
    },
    {
        id: 'chat2',
        participant: MOCK_PROS[1],
        lastMessage: 'xfbxfbx',
        timestamp: 'Agora',
        unreadCount: 0,
        messages: [
            { id: 'm4', senderId: 'pro2', text: 'xfbxfbx', timestamp: 'Agora' }
        ]
    }
];

export default function App() {
    const [userRole, setUserRole] = useState<'client' | 'professional'>('client');
    const [currentView, setCurrentView] = useState<View>('splash');
    const [viewHistory, setViewHistory] = useState<View[]>(['splash']);

    // Refs to track state and avoid stale closures in listeners
    const userRoleRef = useRef(userRole);
    const currentViewRef = useRef(currentView);

    useEffect(() => {
        userRoleRef.current = userRole;
    }, [userRole]);

    useEffect(() => {
        currentViewRef.current = currentView;
    }, [currentView]);

    // Sync currentView with viewHistory
    useEffect(() => {
        if (viewHistory.length > 0) {
            const lastView = viewHistory[viewHistory.length - 1];
            if (currentView !== lastView) {
                console.log(`[Navigation] Syncing currentView to: ${lastView}`);
                setCurrentView(lastView);
            }
        }
    }, [viewHistory]);
    const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewerImage, setViewerImage] = useState<string | null>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewComment, setReviewComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [workerTypeFilter, setWorkerTypeFilter] = useState<'all' | 'professional' | 'autonomous'>('all');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Initialize reviews from database
    const [reviews, setReviews] = useState<Review[]>([]);
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChatMessages, setActiveChatMessages] = useState<MessageType[]>([]);
    const activeChat = chats.find(c => c.id === activeChatId) || null;
    const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;


    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('[Auth] Initializing auth system...');

        const handleAuthChange = async (session: Session | null) => {
            console.log('[Auth] Handling auth state change, session exists:', !!session);
            setSession(session);

            if (session?.user) {
                // ONLY use metadata if we are in the initial load (splash) 
                // and don't have a profile yet to avoid overwriting current selection
                const metadataRole = session.user.user_metadata?.role as UserRole;

                // Use Refs to see the LATEST values, avoiding stale closures
                if (currentViewRef.current === 'splash' && metadataRole && (metadataRole === 'client' || metadataRole === 'professional')) {
                    console.log('[Auth] Initial load: Using metadata role hint:', metadataRole);
                    setUserRole(metadataRole);
                }

                try {
                    console.log('[Auth] Fetching profile for:', session.user.id);
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    console.log('[Auth] Profile result:', { profile, error: profileError });

                    if (profile) {
                        console.log('[Auth] Found profile in DB, setting role:', profile.role);
                        setUserRole(profile.role);
                        setCurrentUser({
                            ...profile,
                            name: profile.full_name || session.user.user_metadata?.name || 'User',
                            avatar: profile.avatar_url || (profile.role === 'professional' ? 'https://picsum.photos/seed/pro-default/200/200' : 'https://picsum.photos/seed/user-default/200/200'),
                        } as any);
                        navigate(profile.role === 'client' ? 'client_home' : 'professional_home', { reset: true, ignoreGuards: true });
                    } else {
                        console.warn('[Auth] No profile found in database - using latest selection from Ref:', userRoleRef.current);
                        // IMPORTANT: Trust the userRoleRef here. If they clicked 'Client', stay as client.

                        setCurrentUser(prev => ({
                            ...prev,
                            id: session.user.id,
                            name: session.user.user_metadata?.name || 'User',
                            email: session.user.email || '',
                            role: userRoleRef.current // PRIORITIZE ref value over anything else
                        } as any));

                        navigate('complete_profile', { reset: true, ignoreGuards: true });
                    }
                } catch (err) {
                    console.error('[Auth] Error fetching profile:', err);
                    // Better to stay safe and ask for profile completion if something is wrong
                    navigate('complete_profile', { reset: true });
                }
            } else {
                console.log('[Auth] No session - resetting to role_selection');
                // Don't force reset states if we are just starting and might have a session soon
                // but if we are sure there is no session, then reset.
            }

            setLoading(false);
        };

        // Initial check
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleAuthChange(session);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('[Auth] Event received:', event);
            if (event === 'PASSWORD_RECOVERY') {
                navigate('reset_password', { reset: true });
            } else {
                handleAuthChange(session);
            }
        });

        return () => subscription.unsubscribe();
    }, []);


    // Fetch professionals
    useEffect(() => {
        const fetchPros = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'professional');

            if (data) {
                const formattedPros = data.map(p => ({
                    ...p,
                    name: p.full_name || 'Profissional',
                    avatar: p.avatar_url || 'https://picsum.photos/seed/pro-default/200/200',
                    rating: parseFloat(p.rating || '0'),
                    reviewsCount: p.reviews_count || 0,
                    completedServices: p.completed_services || 0,
                    yearsExp: p.years_exp || 0,
                    workerType: p.worker_type || 'professional',
                    portfolio: p.portfolio || []
                }));
                setProfessionals(formattedPros);
            }
        };

        fetchPros();
    }, []);

    // Fetch reviews
    useEffect(() => {
        const fetchReviews = async () => {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
                    *,
                    user:profiles!user_id(full_name, avatar_url)
                `)
                .order('created_at', { ascending: false });

            if (data) {
                const formattedReviews = data.map(r => ({
                    id: r.id,
                    professionalId: r.professional_id,
                    userId: r.user_id,
                    userName: (r.user as any)?.full_name || 'Usuário',
                    userAvatar: (r.user as any)?.avatar_url || 'https://picsum.photos/seed/user-default/200/200',
                    rating: r.rating,
                    comment: r.comment,
                    date: new Date(r.created_at).toLocaleDateString('pt-BR')
                }));
                setReviews(formattedReviews);
            }
        };

        fetchReviews();
    }, []);

    // Fetch Chats
    useEffect(() => {
        if (!session?.user) return;

        const fetchChats = async () => {
            const { data, error } = await supabase
                .from('chats')
                .select(`
                    *,
                    sender:profiles!sender_id(id, full_name, avatar_url, role),
                    receiver:profiles!receiver_id(id, full_name, avatar_url, role)
                `)
                .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
                .order('updated_at', { ascending: false });

            if (data) {
                const formattedChats: Chat[] = data.map(c => {
                    const isSender = c.sender_id === session.user.id;
                    const participant = isSender ? c.receiver : c.sender;

                    return {
                        id: c.id,
                        participant: {
                            ...participant,
                            name: participant.full_name || 'Usuário',
                            avatar: participant.avatar_url || 'https://picsum.photos/seed/user-default/200/200'
                        },
                        lastMessage: c.last_message || 'Nenhuma mensagem',
                        timestamp: new Date(c.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        unreadCount: 0,
                        messages: []
                    };
                });
                setChats(formattedChats);
            }
        };

        fetchChats();

        // Real-time subscription for chats
        const channel = supabase
            .channel('public:chats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
                fetchChats();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.user]);

    // Fetch Messages for active chat
    useEffect(() => {
        if (!activeChat) {
            // Only clear messages if we are truly exiting any chat view
            // If activeChat is null but currentView is 'chat_room', we might be in a 'temp' state
            if (currentView !== 'chat_room') {
                setActiveChatMessages([]);
            }
            return;
        }

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', activeChat.id)
                .order('created_at', { ascending: true });

            if (data) {
                setActiveChatMessages(data.map(m => ({
                    id: m.id,
                    senderId: m.sender_id,
                    text: m.text,
                    timestamp: new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                })));
            }
        };

        fetchMessages();

        // Real-time subscription for messages
        const channel = supabase
            .channel(`chat:${activeChat.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `chat_id=eq.${activeChat.id}`
            }, (payload) => {
                const newMessage = payload.new;
                setActiveChatMessages(prev => {
                    // Deduplicate: Don't add if the message is already there (e.g. from optimistic update)
                    if (prev.some(m => m.id === newMessage.id)) return prev;

                    return [...prev, {
                        id: newMessage.id,
                        senderId: newMessage.sender_id,
                        text: newMessage.text,
                        timestamp: new Date(newMessage.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    }];
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeChat]);

    // Fetch Notifications
    useEffect(() => {
        if (!session?.user) {
            setNotifications([]);
            return;
        }

        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (data) {
                setNotifications(data);
            }
        };

        fetchNotifications();

        // Real-time subscription for notifications
        const channel = supabase
            .channel(`notifications:${session.user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${session.user.id}`
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setNotifications(prev => [payload.new as Notification, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                    setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new as Notification : n));
                } else if (payload.eventType === 'DELETE') {
                    setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.user]);

    // Save reviews to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('guilda_reviews', JSON.stringify(reviews));
    }, [reviews]);

    // Splash Screen Transition
    useEffect(() => {
        if (currentView === 'splash') {
            const timer = setTimeout(() => {
                // Only navigate to role_selection if we are still on splash and no session was found
                if (currentView === 'splash' && !session) {
                    console.log('[Splash] Timer finished, no session found, navigating to role_selection');
                    navigate('role_selection', { reset: true });
                }
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [currentView, session]);

    const [currentUser, setCurrentUser] = useState<User>(() => ({
        id: 'visitor',
        name: 'Visitante',
        email: '',
        role: 'client',
        avatar: 'https://picsum.photos/seed/user-default/200/200',
        location: 'São Paulo, SP',
        phone: ''
    }));

    // Schedule State
    const [viewDate, setViewDate] = useState(new Date(2026, 1, 1)); // Fevereiro 2026
    const [activePeriod, setActivePeriod] = useState<'morning' | 'afternoon' | 'evening'>('morning');
    const [availableDays, setAvailableDays] = useState<string[]>(['2026-02-24', '2026-02-25']);
    const [unavailableDays, setUnavailableDays] = useState<string[]>(['2026-02-02', '2026-02-03', '2026-02-04', '2026-02-05', '2026-02-06', '2026-02-07', '2026-02-09', '2026-02-10', '2026-02-11', '2026-02-12', '2026-02-13', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20']);
    const [morningHours, setMorningHours] = useState(['07:00', '08:00', '09:00', '10:00', '11:00']);
    const [afternoonHours, setAfternoonHours] = useState(['13:00', '14:00', '15:00', '16:00', '17:00']);
    const [eveningHours, setEveningHours] = useState(['18:00', '19:00', '20:00', '21:00']);

    // Rating Helpers
    const getProRating = (proId: string) => {
        const proReviews = reviews.filter(r => r.professionalId === proId);
        if (proReviews.length === 0) return { rating: 0, count: 0 };
        const sum = proReviews.reduce((acc, r) => acc + r.rating, 0);
        return {
            rating: parseFloat((sum / proReviews.length).toFixed(1)),
            count: proReviews.length
        };
    };

    const getReviewDistribution = (proId: string) => {
        const proReviews = reviews.filter(r => r.professionalId === proId);
        const distribution = [0, 0, 0, 0, 0];
        proReviews.forEach(r => {
            if (r.rating >= 1 && r.rating <= 5) {
                distribution[5 - r.rating]++;
            }
        });
        const total = proReviews.length || 1;
        return distribution.map(count => (count / total) * 100);
    };

    // Navigation Helper
    const navigate = (view: View, options?: { replace?: boolean; reset?: boolean; ignoreGuards?: boolean }) => {
        const { replace = false, reset = false, ignoreGuards = false } = options || {};
        console.log(`[Navigation] navigate to: ${view}`, { replace, reset, ignoreGuards });

        const CLIENT_ONLY_VIEWS: View[] = ['client_home', 'search', 'booking', 'client_profile'];
        const PRO_ONLY_VIEWS: View[] = ['professional_home', 'manage_portfolio', 'edit_schedule'];

        if (!ignoreGuards) {
            if (userRole === 'client' && PRO_ONLY_VIEWS.includes(view)) {
                console.warn(`[Navigation] Blocked access to PRO view: ${view} for client`);
                return;
            }
            if (userRole === 'professional' && CLIENT_ONLY_VIEWS.includes(view)) {
                console.warn(`[Navigation] Blocked access to CLIENT view: ${view} for professional`);
                return;
            }
        }

        // Prevent duplicate consecutive entries
        if (viewHistory[viewHistory.length - 1] === view) return;

        if (reset) {
            setViewHistory([view]);
        } else if (replace) {
            setViewHistory(prev => (prev.length > 0 ? [...prev.slice(0, -1), view] : [view]));
        } else {
            setViewHistory(prev => [...prev, view]);
        }
        window.scrollTo(0, 0);
    };

    const goBack = () => {
        console.log('[Navigation] goBack requested', { history: viewHistory });
        if (viewHistory.length > 1) {
            setViewHistory(prev => {
                const newHistory = [...prev];
                newHistory.pop();
                return newHistory;
            });
            window.scrollTo(0, 0);
        } else {
            const homeView = userRole === 'professional' ? 'professional_home' : 'client_home';
            if (currentView !== homeView) {
                console.log(`[Navigation] History empty, returning to home: ${homeView}`);
                setViewHistory([homeView]);
            }
        }
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
        } else {
            console.log('[Auth] Successfully signed out, redirecting to role_selection');
            navigate('role_selection', { reset: true, ignoreGuards: true });
        }
    };

    // --- Components for Screens ---

    // Shared Navigation Components
    // Shared Navigation Components
    const ClientBottomNav = () => {
        const unreadMsgs = chats.filter(c => c.unread).length;

        return (
            <nav className="fixed bottom-0 left-0 right-0 bg-[#1f2937]/95 backdrop-blur-lg border-t border-gray-800 px-6 py-4 pb-8 flex justify-between items-center z-40">
                <button onClick={() => navigate('client_home', { replace: true })} className={`flex flex-col items-center gap-1 ${currentView === 'client_home' ? 'text-[#1b7cf5]' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Home className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Início</span>
                </button>
                <button onClick={() => navigate('search', { replace: true })} className={`flex flex-col items-center gap-1 ${currentView === 'search' ? 'text-[#1b7cf5]' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Search className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Buscar</span>
                </button>
                <button onClick={() => navigate('messages', { replace: true })} className={`flex flex-col items-center gap-1 relative ${['messages', 'chat_room'].includes(currentView) ? 'text-[#1b7cf5]' : 'text-gray-500 hover:text-gray-300'}`}>
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Mensagens</span>
                    {unreadMsgs > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#1f2937]">{unreadMsgs}</span>}
                </button>
                <button onClick={logout} className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-500 transition-colors">
                    <LogOut className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Sair</span>
                </button>
                <button onClick={() => navigate('edit_profile', { replace: true })} className={`flex flex-col items-center gap-1 ${['edit_profile', 'client_profile'].includes(currentView) ? 'text-[#1b7cf5]' : 'text-gray-500 hover:text-gray-300'}`}>
                    <UserIcon className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Perfil</span>
                </button>
            </nav>
        );
    };

    const ProfessionalBottomNav = () => {
        const unreadMsgs = chats.filter(c => c.unread).length;

        return (
            <nav className="fixed bottom-0 left-0 right-0 bg-[#1f2937]/95 backdrop-blur-lg border-t border-gray-800 px-6 py-4 pb-8 flex justify-between items-center z-40">
                <button onClick={() => navigate('professional_home', { replace: true })} className={`flex flex-col items-center gap-1 ${currentView === 'professional_home' ? 'text-[#1b7cf5]' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Home className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Início</span>
                </button>
                <button onClick={() => navigate('manage_portfolio', { replace: true })} className={`flex flex-col items-center gap-1 ${currentView === 'manage_portfolio' ? 'text-[#1b7cf5]' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Grid className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Portfólio</span>
                </button>
                <button onClick={() => navigate('messages', { replace: true })} className={`flex flex-col items-center gap-1 relative ${['messages', 'chat_room'].includes(currentView) ? 'text-[#1b7cf5]' : 'text-gray-500 hover:text-gray-300'}`}>
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Mensagens</span>
                    {unreadMsgs > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#1f2937]">{unreadMsgs}</span>}
                </button>
                <button onClick={logout} className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-500 transition-colors">
                    <LogOut className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Sair</span>
                </button>
                <button
                    onClick={() => {
                        setSelectedPro(currentUser as Professional);
                        navigate('pro_profile', { replace: true });
                    }}
                    className={`flex flex-col items-center gap-1 ${['pro_profile', 'edit_profile'].includes(currentView) ? 'text-[#1b7cf5]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <UserIcon className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Perfil</span>
                </button>
            </nav>
        );
    };

    const SplashScreen = () => (
        <div className="min-h-screen bg-[#101822] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#1b7cf5]/20 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{
                    duration: 1.2,
                    ease: [0, 0.71, 0.2, 1.01],
                    scale: {
                        type: "spring",
                        damping: 12,
                        stiffness: 100,
                        restDelta: 0.001
                    }
                }}
                className="relative z-10 flex flex-col items-center"
            >
                <div className="relative">
                    <motion.div
                        animate={{
                            scale: [1, 1.05, 1],
                            opacity: [0.8, 1, 0.8]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute inset-0 bg-[#1b7cf5]/30 rounded-full blur-2xl"
                    />
                    <img
                        src={logo}
                        alt="Guilda Logo"
                        className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-[0_0_15px_rgba(27,124,245,0.5)]"
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="mt-8 text-center"
                >
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">
                        GUILDA
                    </h1>
                    <div className="flex items-center gap-2 justify-center">
                        <div className="w-8 h-px bg-gradient-to-r from-transparent to-gray-600" />
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em]">Conectando Talentos</span>
                        <div className="w-8 h-px bg-gradient-to-l from-transparent to-gray-600" />
                    </div>
                </motion.div>
            </motion.div>

            {/* Loading Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-16 flex flex-col items-center gap-4"
            >
                <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 1, 0.3]
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2
                            }}
                            className="w-1.5 h-1.5 bg-[#1b7cf5] rounded-full"
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );

    const RoleSelectionScreen = () => (
        <div className="min-h-screen bg-[#101822] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#1b7cf5]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12 relative z-10"
            >
                <img src={logo} className="w-20 h-20 mx-auto mb-6 drop-shadow-lg" alt="Logo" />
                <h2 className="text-3xl font-bold text-white mb-2">Como deseja usar o <span className="italic text-[#1b7cf5]">Guilda</span>?</h2>
                <p className="text-gray-400">Selecione o seu perfil para continuar</p>
            </motion.div>

            <div className="grid grid-cols-1 gap-6 w-full max-w-sm relative z-10">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        setUserRole('client');
                        navigate('login');
                    }}
                    className="group relative bg-[#1f2937] border border-gray-800 p-8 rounded-[32px] overflow-hidden text-left hover:border-[#1b7cf5] transition-all"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-[#1b7cf5]/10 flex items-center justify-center group-hover:bg-[#1b7cf5] transition-colors">
                            <UserIcon className="w-8 h-8 text-[#1b7cf5] group-hover:text-white transition-colors" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">Sou Cliente</h3>
                            <p className="text-sm text-gray-500">Quero contratar profissionais qualificados</p>
                        </div>
                    </div>
                    <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-700 group-hover:text-[#1b7cf5]" />
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        setUserRole('professional');
                        navigate('login');
                    }}
                    className="group relative bg-[#1f2937] border border-gray-800 p-8 rounded-[32px] overflow-hidden text-left hover:border-[#1b7cf5] transition-all"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                            <Briefcase className="w-8 h-8 text-emerald-500 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">Sou Profissional</h3>
                            <p className="text-sm text-gray-500">Quero oferecer meus serviços e crescer</p>
                        </div>
                    </div>
                    <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-700 group-hover:text-emerald-500" />
                </motion.button>
            </div>
        </div>
    );

    const LoginScreen = () => {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [error, setError] = useState<string | null>(null);
        const [isLoggingIn, setIsLoggingIn] = useState(false);

        const handleLogin = async (e: React.FormEvent) => {
            e.preventDefault();
            setError(null);
            setIsLoggingIn(true);
            try {
                console.log('[Login] Attempting sign-in...');
                const { data, error: loginError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                console.log('[Login] Sign-in result:', { error: loginError, user: data?.user });
                if (loginError) throw loginError;

                // Redirection will be handled by handleAuthChange (supabase.auth.onAuthStateChange)
                // We DON'T set the role here from metadata to avoid conflicts if profile differs
                console.log('[Login] Login successful, waiting for auth change...');
            } catch (err: any) {
                console.error('[Login] Caught error:', err);
                setError(err.message || 'Erro ao entrar. Verifique suas credenciais.');
            } finally {
                console.log('[Login] Login process finished');
                setIsLoggingIn(false);
            }
        };

        return (
            <div className="min-h-screen bg-[#101822] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-[#1f2937] rounded-3xl overflow-hidden border border-gray-800 shadow-2xl relative"
                >
                    <button
                        onClick={() => navigate('role_selection', { replace: true })}
                        className="absolute top-6 left-6 z-20 text-white/50 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>

                    <div className="h-48 bg-gradient-to-br from-[#1b7cf5] to-[#0891b2] flex flex-col items-center justify-center relative">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl ring-1 ring-white/20 mb-4 transform rotate-3 overflow-hidden">
                            <img src={logo} className="w-14 h-14 object-contain drop-shadow-lg" alt="Logo" />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight italic">Guilda</h1>
                        <p className="text-white/70 text-sm mt-1">{userRole === 'client' ? 'Encontre profissionais de elite' : 'Sua plataforma de negócios'}</p>
                    </div>

                    <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Entrar como <span className="text-[#1b7cf5] capitalize">{userRole === 'client' ? 'Cliente' : 'Profissional'}</span></h2>
                        </div>
                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl mb-4">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">E-mail</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        className="w-full bg-[#111827] border border-gray-700 rounded-xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-[#1b7cf5] focus:border-transparent transition-all"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-[#111827] border border-gray-700 rounded-xl py-3.5 pl-12 pr-12 text-white focus:ring-2 focus:ring-[#1b7cf5] focus:border-transparent transition-all"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => navigate('forgot_password')}
                                    className="text-sm font-semibold text-[#1b7cf5] hover:underline"
                                >
                                    Esqueceu a senha?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoggingIn}
                                className="w-full bg-[#1b7cf5] hover:bg-[#1b7cf5]/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-[#1b7cf5]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoggingIn ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Entrar <ChevronRight className="w-5 h-5" /></>
                                )}
                            </button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
                                <div className="relative flex justify-center text-xs uppercase tracking-widest text-gray-500 bg-[#1f2937] px-4">Ou continue com</div>
                            </div>

                            <button type="button" className="w-full bg-[#111827] border border-gray-800 text-white py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors">
                                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                                <span className="font-semibold">Google</span>
                            </button>
                        </form>
                    </div>

                    <div className="bg-[#111827]/50 p-6 text-center border-t border-gray-800">
                        <p className="text-gray-400 text-sm">
                            Não tem uma conta?
                            <button onClick={() => navigate('register')} className="font-bold text-[#1b7cf5] ml-1 hover:underline">Cadastre-se</button>
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    };

    const RegisterScreen = () => {
        const [name, setName] = useState('');
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [specialty, setSpecialty] = useState('Eletricista');
        const [workerType, setWorkerType] = useState<'professional' | 'autonomous'>('professional');
        const [error, setError] = useState<string | null>(null);
        const [isRegistering, setIsRegistering] = useState(false);
        const [showConfirmationMsg, setShowConfirmationMsg] = useState(false);

        const handleRegister = async (e: React.FormEvent) => {
            e.preventDefault();
            setError(null);
            setShowConfirmationMsg(false);
            setIsRegistering(true);
            try {
                const { data, error: registerError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name,
                            role: userRole,
                            specialty: userRole === 'professional' ? specialty : undefined,
                            worker_type: userRole === 'professional' ? workerType : undefined,
                        }
                    }
                });
                if (registerError) throw registerError;

                if (data.user && !data.session) {
                    setShowConfirmationMsg(true);
                }
                // Redirection is handled by onAuthStateChange if session exists
            } catch (err: any) {
                setError(err.message || 'Erro ao criar conta.');
            } finally {
                setIsRegistering(false);
            }
        };

        return (
            <div className="min-h-screen bg-[#101822] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-md bg-[#1f2937] rounded-3xl overflow-hidden border border-gray-800 shadow-2xl"
                >
                    <div className="p-8">
                        <button onClick={() => navigate('login', { replace: true })} className="mb-6 text-gray-400 hover:text-white flex items-center gap-2">
                            <ArrowLeft className="w-5 h-5" /> Voltar
                        </button>
                        <h2 className="text-3xl font-bold text-white mb-2">Criar Conta</h2>
                        <p className="text-gray-400 mb-8">Junte-se à nossa comunidade de {userRole === 'client' ? 'contratantes' : 'profissionais'}</p>

                        <form onSubmit={handleRegister} className="space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl mb-4">
                                    {error}
                                </div>
                            )}
                            {showConfirmationMsg && (
                                <div className="bg-[#1b7cf5]/10 border border-[#1b7cf5]/20 text-[#1b7cf5] text-xs p-4 rounded-xl mb-4 flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                    <p>Conta criada! Por favor, verifique seu e-mail para confirmar seu cadastro.</p>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Nome Completo</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Seu nome"
                                    className="w-full bg-[#111827] border border-gray-700 rounded-xl py-3.5 px-4 text-white focus:ring-2 focus:ring-[#1b7cf5]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">E-mail</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="w-full bg-[#111827] border border-gray-700 rounded-xl py-3.5 px-4 text-white focus:ring-2 focus:ring-[#1b7cf5]"
                                    required
                                />
                            </div>
                            {userRole === 'professional' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Especialidade / Profissão</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                            <select
                                                value={specialty}
                                                onChange={(e) => setSpecialty(e.target.value)}
                                                className="w-full bg-[#111827] border border-gray-700 rounded-xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-[#1b7cf5] appearance-none cursor-pointer"
                                            >
                                                <option>Eletricista</option>
                                                <option>Encanador</option>
                                                <option>Pintor</option>
                                                <option>Designer</option>
                                                <option>Diarista</option>
                                                <option>Manutenção</option>
                                                <option>Outros</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Tipo de Atuação</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setWorkerType('professional')}
                                                className={`py-3 rounded-xl border text-xs font-bold transition-all ${workerType === 'professional' ? 'bg-[#1b7cf5] border-[#1b7cf5] text-white' : 'bg-[#111827] border-gray-700 text-gray-400'}`}
                                            >
                                                Profissional / Empresa
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setWorkerType('autonomous')}
                                                className={`py-3 rounded-xl border text-xs font-bold transition-all ${workerType === 'autonomous' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-[#111827] border-gray-700 text-gray-400'}`}
                                            >
                                                Autônomo
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Senha</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[#111827] border border-gray-700 rounded-xl py-3.5 px-4 text-white focus:ring-2 focus:ring-[#1b7cf5]"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isRegistering}
                                className="w-full bg-[#1b7cf5] hover:bg-[#1b7cf5]/90 text-white font-bold py-4 rounded-xl shadow-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isRegistering ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    'Criar Conta'
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="bg-[#111827]/50 p-6 text-center border-t border-gray-800">
                        <p className="text-gray-400 text-sm">
                            Já tem uma conta?
                            <button onClick={() => navigate('login')} className="font-bold text-[#1b7cf5] ml-1 hover:underline">Entre aqui</button>
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    };

    const ClientHomeScreen = () => {
        const handleSearch = (e: React.FormEvent) => {
            e.preventDefault();
            navigate('search');
        };

        return (
            <div className="min-h-screen bg-[#101822] pb-24">
                <header className="px-6 pt-12 pb-6 bg-[#1f2937]/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-800">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div
                                onClick={() => navigate('edit_profile')}
                                className="w-10 h-10 rounded-full bg-[#1b7cf5]/20 border border-[#1b7cf5]/30 flex items-center justify-center overflow-hidden cursor-pointer"
                            >
                                {currentUser.avatar ? (
                                    <img src={currentUser.avatar} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                    <UserIcon className="text-[#1b7cf5] w-6 h-6" />
                                )}
                            </div>
                            <div
                                onClick={() => navigate('edit_profile')}
                                className="cursor-pointer"
                            >
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Localização</span>
                                <div className="flex items-center text-white font-bold text-sm">
                                    <MapPin className="w-3 h-3 text-[#1b7cf5] mr-1" /> {currentUser.location || 'São Paulo, SP'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Qual serviço você procura?"
                            className="w-full bg-[#111827] border border-gray-700 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-[#1b7cf5]"
                        />
                    </form>
                </header>

                <main className="px-6 pt-6 space-y-8">
                    <section>
                        <div
                            onClick={() => { setSearchQuery('Limpeza'); navigate('search'); }}
                            className="bg-gradient-to-br from-[#1b7cf5] to-[#0891b2] rounded-3xl p-6 relative overflow-hidden shadow-xl shadow-[#1b7cf5]/10 cursor-pointer active:scale-[0.98] transition-all"
                        >
                            <div className="relative z-10 max-w-[60%]">
                                <h3 className="text-white text-xl font-bold leading-tight">Até 30% de desconto em Limpeza Doméstica</h3>
                                <button className="mt-4 bg-white text-[#1b7cf5] px-4 py-2 rounded-xl text-xs font-bold shadow-lg">Aproveitar Agora</button>
                            </div>
                            <Briefcase className="absolute right-[-20px] bottom-[-20px] w-40 h-40 text-white/10 rotate-12" />
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white">Categorias</h2>
                            <button onClick={() => navigate('search')} className="text-[#1b7cf5] text-sm font-bold">Ver tudo</button>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { icon: <Droplets className="w-6 h-6" />, label: 'Encanador' },
                                { icon: <Zap className="w-6 h-6" />, label: 'Elétrica' },
                                { icon: <Palette className="w-6 h-6" />, label: 'Pintura' },
                                { icon: <Hammer className="w-6 h-6" />, label: 'Reformas' },
                                { icon: <Wind className="w-6 h-6" />, label: 'Ar Cond.' },
                                { icon: <Sparkles className="w-6 h-6" />, label: 'Limpeza' },
                                { icon: <Sprout className="w-6 h-6" />, label: 'Jardim' },
                                { icon: <Grid className="w-6 h-6" />, label: 'Outros' }
                            ].map((cat, i) => (
                                <div
                                    key={i}
                                    onClick={() => { setSearchQuery(cat.label); navigate('search'); }}
                                    className="flex flex-col items-center gap-2 group cursor-pointer active:scale-90 transition-all"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-[#111827] border border-gray-800 flex items-center justify-center group-hover:border-[#1b7cf5] transition-all">
                                        <div className="text-[#1b7cf5]">{cat.icon}</div>
                                    </div>
                                    <span className="text-[10px] font-medium text-gray-400 text-center">{cat.label}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white">Profissionais em Destaque</h2>
                            <button className="text-[#1b7cf5] text-sm font-bold">Ver todos</button>
                        </div>
                        <div className="space-y-4">
                            {(professionals.length > 0 ? professionals : MOCK_PROS).map(pro => (
                                <div
                                    key={pro.id}
                                    onClick={() => { setSelectedPro(pro); navigate('pro_profile'); }}
                                    className="bg-[#111827] border border-gray-800 p-4 rounded-2xl flex items-center gap-4 hover:border-[#1b7cf5]/50 transition-all cursor-pointer group"
                                >
                                    <img src={pro.avatar} className="w-16 h-16 rounded-xl object-cover" alt={pro.name} />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-white">{pro.name}</h4>
                                            <div className="flex items-center bg-[#1b7cf5]/10 px-2 py-0.5 rounded-lg">
                                                <Star className="w-3 h-3 text-[#1b7cf5] fill-[#1b7cf5] mr-1" />
                                                <span className="text-xs font-bold text-[#1b7cf5]">{pro.rating}</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{pro.specialty}</p>
                                        <div className="flex items-center mt-2 text-[10px] text-gray-600 font-bold uppercase tracking-wider">
                                            <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                                            {pro.completedServices}+ serviços concluídos
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>

                <ClientBottomNav />
            </div>
        );
    };

    const ProfessionalHomeScreen = () => {
        const stats = [
            { label: 'Nota Geral', value: currentUser.rating?.toString() || '0', icon: <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />, trend: 'Sincronizado' },
            { label: 'Serviços', value: (currentUser as Professional).completedServices?.toString() || '0', icon: <CheckCircle2 className="w-5 h-5 text-[#1b7cf5]" />, trend: 'Total' },
            { label: 'Avaliações', value: (currentUser as Professional).reviewsCount?.toString() || '0', icon: <MessageSquare className="w-5 h-5 text-emerald-500" />, trend: 'Feedback' },
        ];

        return (
            <div className="min-h-screen bg-[#101822] pb-24">
                <header className="px-6 pt-12 pb-6 bg-[#1f2937]/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1b7cf5] to-[#0891b2] p-0.5">
                                <img src={currentUser.avatar} className="w-full h-full object-cover rounded-[14px]" alt="Profile" />
                            </div>
                            <div>
                                <h1 className="text-white font-bold text-lg">Olá, {currentUser.name.split(' ')[0]}!</h1>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded">Online agora</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="px-6 pt-6 space-y-8">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-[#1f2937] p-6 rounded-3xl border border-gray-800 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Status da Agenda</p>
                                <h3 className="text-white font-bold text-xl">Livre para hoje</h3>
                            </div>
                            <button
                                onClick={() => navigate('edit_schedule')}
                                className="bg-[#1b7cf5] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-[#1b7cf5]/20"
                            >
                                Gerenciar
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-[#111827] p-4 rounded-2xl border border-gray-800">
                                <div className="mb-3">{stat.icon}</div>
                                <div className="text-lg font-bold text-white leading-tight">{stat.value}</div>
                                <div className="text-[10px] font-bold text-gray-600 uppercase mt-0.5">{stat.label}</div>
                                <div className={`text-[10px] font-bold mt-2 ${stat.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {stat.trend} este mês
                                </div>
                            </div>
                        ))}
                    </div>

                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white">Próximos Agendamentos</h2>
                            <button className="text-[#1b7cf5] text-sm font-bold">Ver agenda</button>
                        </div>
                        <div className="space-y-4">
                            {[
                                { name: 'Mariana Lima', service: 'Pintura Interna', time: 'Hoje, 14:00', price: 'R$ 450' },
                                { name: 'João Pedro', service: 'Reparo Elétrico', time: 'Amanhã, 09:30', price: 'R$ 180' }
                            ].map((job, i) => (
                                <div key={i} className="bg-[#111827] border border-gray-800 p-4 rounded-2xl flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#1f2937] rounded-xl flex items-center justify-center text-[#1b7cf5] font-bold">
                                        {job.time.split(' ')[0][0]}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <h4 className="font-bold text-white">{job.name}</h4>
                                            <span className="text-emerald-400 font-bold text-xs">{job.price}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">{job.service}</p>
                                        <div className="flex items-center mt-2 text-[10px] text-gray-500 font-bold uppercase">
                                            <Clock className="w-3 h-3 mr-1" /> {job.time}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>

                <ProfessionalBottomNav />
            </div >
        );
    };

    const ProfessionalReviewsScreen = () => {
        const proId = userRole === 'professional' ? currentUser.id : (selectedPro?.id || 'pro1');
        const proName = userRole === 'professional' ? currentUser.name : (selectedPro?.name || 'Profissional');
        const proReviews = reviews.filter(r => r.professionalId === proId);
        const { rating, count } = getProRating(proId);
        const distribution = getReviewDistribution(proId);

        return (
            <div className="min-h-screen bg-[#101822] pb-24">
                <header className="px-6 pt-12 pb-6 bg-[#1f2937]/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-800">
                    <div className="flex items-center gap-4">
                        <button onClick={() => goBack()} className="text-[#1b7cf5] p-2 -ml-2">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold text-white">Avaliações</h1>
                    </div>
                </header>

                <main className="px-6 pt-6 space-y-8">
                    <div className="bg-[#1f2937] rounded-3xl p-6 border border-gray-800 shadow-xl">
                        <div className="flex items-center gap-8 mb-8">
                            <div className="text-center">
                                <div className="text-5xl font-bold text-white mb-2">{rating}</div>
                                <div className="flex gap-0.5 justify-center mb-1">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-700'}`} />
                                    ))}
                                </div>
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{count} avaliações</div>
                            </div>
                            <div className="flex-1 space-y-2">
                                {distribution.map((percentage, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-gray-500 w-2">{5 - i}</span>
                                        <div className="flex-1 h-1.5 bg-[#111827] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#1b7cf5]"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            {proReviews.length > 0 ? proReviews.map(review => (
                                <div key={review.id} className="border-t border-gray-800 pt-6 first:border-0 first:pt-0">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden">
                                            <img src={review.userAvatar} className="w-full h-full object-cover" alt={review.userName} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">{review.userName}</h4>
                                            <div className="flex items-center gap-3">
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <Star key={s} className={`w-2 h-2 ${s <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-700'}`} />
                                                    ))}
                                                </div>
                                                <span className="text-[10px] text-gray-600 font-bold">{review.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-sm leading-relaxed">{review.comment}</p>
                                </div>
                            )) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 font-medium">Nenhuma avaliação ainda.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {userRole === 'client' && (
                        <button
                            onClick={() => setIsReviewModalOpen(true)}
                            className="w-full bg-[#1b7cf5] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#1b7cf5]/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                            <Star className="w-5 h-5" /> Escrever Avaliação
                        </button>
                    )}
                </main>
                <ProfessionalBottomNav />
            </div>
        );
    };

    const ProfessionalProfileScreen = () => {
        const pro = selectedPro || (currentUser as Professional);
        const isOwnProfile = currentUser.id === pro.id;
        const { rating, count } = getProRating(pro.id);

        return (
            <div className="min-h-screen bg-[#101822] pb-32">
                <div className="relative h-72">
                    <img src={pro.avatar} className="w-full h-full object-cover" alt={pro.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#101822] via-[#101822]/40 to-transparent"></div>
                    <div className="absolute top-12 left-6 right-6 flex justify-between">
                        <button onClick={() => goBack()} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="flex gap-2">
                            <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                                <Heart className="w-5 h-5" />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-6 -mt-16 relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-[#1b7cf5] bg-[#1b7cf5]/10 px-2.5 py-1 rounded-full uppercase tracking-widest border border-[#1b7cf5]/20">
                            {pro.specialty}
                        </span>
                        <div className="flex items-center bg-gray-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/5">
                            <Verified className="w-3 h-3 text-[#1b7cf5] mr-1" />
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Verificado</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">{pro.name}</h1>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center text-yellow-500">
                            <Star className="w-4 h-4 fill-yellow-500 mr-1" />
                            <span className="text-sm font-bold text-white">{rating}</span>
                        </div>
                        <button
                            onClick={() => navigate('professional_reviews')}
                            className="text-gray-500 text-xs font-bold hover:text-[#1b7cf5] transition-colors"
                        >
                            ({count} avaliações)
                        </button>
                        <div className="flex items-center text-gray-500">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span className="text-xs font-bold">{pro.location}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-8">
                        <div className="bg-[#1f2937] p-4 rounded-2xl border border-gray-800 shadow-lg">
                            <div className="text-[#1b7cf5] font-bold text-lg leading-none">{pro.completedServices}+</div>
                            <div className="text-[10px] text-gray-600 font-bold uppercase mt-1">Serviços</div>
                        </div>
                        <div className="bg-[#1f2937] p-4 rounded-2xl border border-gray-800 shadow-lg">
                            <div className="text-white font-bold text-lg leading-none">{pro.yearsExp}y</div>
                            <div className="text-[10px] text-gray-600 font-bold uppercase mt-1">Experiência</div>
                        </div>
                        <div className="bg-[#1f2937] p-4 rounded-2xl border border-gray-800 shadow-lg">
                            <div className="text-emerald-400 font-bold text-lg leading-none">{pro.responseTime}</div>
                            <div className="text-[10px] text-gray-600 font-bold uppercase mt-1">Resposta</div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <section>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Sobre</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{pro.bio}</p>
                        </section>

                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Portfólio</h3>
                                {isOwnProfile ? (
                                    <button
                                        onClick={() => navigate('manage_portfolio')}
                                        className="bg-[#1b7cf5]/10 text-[#1b7cf5] px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-[#1b7cf5]/20 flex items-center gap-1.5 active:scale-95 transition-all"
                                    >
                                        <Plus className="w-3 h-3" /> Gerenciar
                                    </button>
                                ) : (
                                    <button className="text-[#1b7cf5] text-xs font-bold">Ver tudo</button>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {pro.portfolio && pro.portfolio.length > 0 ? (
                                    pro.portfolio.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => setViewerImage(item.imageUrl)}
                                            className="aspect-square rounded-2xl overflow-hidden border border-white/5 active:scale-95 transition-all cursor-pointer shadow-lg"
                                        >
                                            <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.title} />
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-3 text-center py-6 bg-gray-900/50 rounded-2xl border border-dashed border-gray-800">
                                        <p className="text-gray-600 text-[10px] uppercase font-bold tracking-widest">Nenhum item no portfólio</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Últimas Avaliações</h3>
                                <button
                                    onClick={() => navigate('professional_reviews')}
                                    className="text-[#1b7cf5] text-xs font-bold"
                                >
                                    Ver todas
                                </button>
                            </div>
                            <div className="space-y-4">
                                {reviews.filter(r => r.professionalId === pro.id).slice(0, 2).map((review) => (
                                    <div key={review.id} className="bg-[#1f2937] p-4 rounded-2xl border border-white/5">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-xs font-bold text-white">{review.userName}</h4>
                                            <div className="flex items-center">
                                                <Star className="w-2.5 h-2.5 text-[#1b7cf5] fill-[#1b7cf5] mr-1" />
                                                <span className="text-[10px] font-bold text-white">{review.rating}</span>
                                            </div>
                                        </div>
                                        <p className="text-gray-400 text-[10px] leading-relaxed line-clamp-2">{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#101822]/90 backdrop-blur-md border-t border-gray-800 z-50">
                    {isOwnProfile ? (
                        <button
                            onClick={() => navigate('edit_profile')}
                            className="w-full bg-[#1b7cf5] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#1b7cf5]/20 active:scale-95 transition-all"
                        >
                            <UserIcon className="w-5 h-5" /> Editar Meu Perfil
                        </button>
                    ) : (
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    const existingChat = chats.find(c => c.participant.id === pro.id);
                                    if (existingChat) {
                                        setActiveChatId(existingChat.id);
                                    } else {
                                        setActiveChatId(null);
                                    }
                                    navigate('chat_room');
                                }}
                                className="flex-1 bg-[#1f2937] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 border border-gray-700 active:scale-95 transition-all"
                            >
                                <MessageSquare className="w-5 h-5" /> Mensagem
                            </button>
                            <button
                                onClick={() => navigate('booking')}
                                className="flex-[2] bg-[#1b7cf5] hover:bg-[#1b7cf5]/90 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#1b7cf5]/20 active:scale-95 transition-all"
                            >
                                <CalendarIcon className="w-5 h-5" /> Agendar Agora
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const NotificationsScreen = () => {
        const markAllAsRead = async () => {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', currentUser?.id)
                .eq('is_read', false);

            if (error) {
                console.error('Error marking notifications as read:', error);
            }
        };

        const deleteNotification = async (id: string) => {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting notification:', error);
            }
        };

        return (
            <div className="min-h-screen bg-[#101822] pb-24">
                <header className="px-6 pt-16 pb-4 flex items-center justify-between sticky top-0 bg-[#101822]/90 backdrop-blur-md z-30 border-b border-gray-800">
                    <button onClick={() => goBack()} className="text-gray-400">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold text-white">Notificações</h1>
                    <button onClick={markAllAsRead} className="text-[#1b7cf5] text-xs font-bold px-2 py-1 rounded-lg active:bg-[#1b7cf5]/10">Lidas</button>
                </header>

                <main className="px-6 pt-6 space-y-4">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-gray-800/30 rounded-full flex items-center justify-center mb-4">
                                <Bell className="w-10 h-10 text-gray-600" />
                            </div>
                            <h3 className="text-gray-400 font-bold">Nenhuma notificação</h3>
                            <p className="text-gray-600 text-sm mt-1">Você está em dia com tudo!</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 rounded-2xl border ${notification.is_read ? 'bg-[#111827] border-gray-800' : 'bg-[#1b7cf5]/5 border-[#1b7cf5]/30'} relative group transition-all`}
                            >
                                <div className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notification.type === 'message' ? 'bg-blue-500/20 text-blue-500' :
                                        notification.type === 'booking' ? 'bg-emerald-500/20 text-emerald-500' :
                                            'bg-purple-500/20 text-purple-500'
                                        }`}>
                                        {notification.type === 'message' ? <MessageSquare className="w-5 h-5" /> :
                                            notification.type === 'booking' ? <CheckCircle2 className="w-5 h-5" /> :
                                                <Bell className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className={`text-sm font-bold ${notification.is_read ? 'text-gray-300' : 'text-white'}`}>{notification.title}</h4>
                                            <span className="text-[10px] text-gray-600 shrink-0 ml-2">{new Date(notification.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notification.content}</p>
                                    </div>
                                </div>
                                {!notification.is_read && (
                                    <div className="absolute top-4 right-4 w-2 h-2 bg-[#1b7cf5] rounded-full"></div>
                                )}
                                <button
                                    onClick={() => deleteNotification(notification.id)}
                                    className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                >
                                    <Trash2 className="w-4 h-4 text-gray-600 hover:text-red-500" />
                                </button>
                            </div>
                        ))
                    )}
                </main>
                {userRole === 'client' ? <ClientBottomNav /> : <ProfessionalBottomNav />}
            </div>
        );
    };

    const MessagesScreen = () => (
        <div className="min-h-screen bg-[#101822] pb-24">
            <header className="px-6 pt-16 pb-4 sticky top-0 bg-[#101822]/95 backdrop-blur-md z-30">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => goBack()} className="text-[#1b7cf5]">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-bold text-white">Mensagens</h1>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Pesquisar conversas..."
                        className="w-full bg-[#111827] border border-gray-700 rounded-xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-[#1b7cf5]"
                    />
                </div>
            </header>

            <main className="px-2 space-y-1 mt-6">
                {chats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-10">
                        <div className="w-20 h-20 rounded-full bg-gray-800/50 flex items-center justify-center mb-6 border border-gray-700/50">
                            <MessageSquare className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="text-white font-bold mb-2">Sem conversas</h3>
                        <p className="text-gray-500 text-sm">Suas conversas aparecerão aqui.</p>
                    </div>
                ) : (
                    chats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => {
                                setActiveChatId(chat.id);
                                navigate('chat_room');
                            }}
                            className="flex items-center p-4 rounded-2xl hover:bg-[#1f2937] transition-colors cursor-pointer group"
                        >
                            <div
                                className="relative shrink-0 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (chat.participant.role === 'professional') {
                                        setSelectedPro(chat.participant as Professional);
                                        navigate('pro_profile');
                                    } else {
                                        navigate('client_profile');
                                    }
                                }}
                            >
                                <img src={chat.participant.avatar} className="w-14 h-14 rounded-full object-cover border-2 border-transparent hover:border-[#1b7cf5] transition-all" alt={chat.participant.name} />
                                {chat.online && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#101822] rounded-full"></div>}
                            </div>
                            <div className="flex-1 min-w-0 ml-4 border-b border-gray-800/50 pb-4 group-hover:border-transparent">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-base font-bold text-white truncate">{chat.participant.name}</h3>
                                    <span className={`text-[10px] font-bold ${chat.unreadCount > 0 ? 'text-[#1b7cf5]' : 'text-gray-500'}`}>{chat.timestamp}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className={`text-sm truncate ${chat.unreadCount > 0 ? 'text-gray-200 font-semibold' : 'text-gray-500'}`}>{chat.lastMessage}</p>
                                    {chat.unreadCount > 0 && (
                                        <span className="flex items-center justify-center w-5 h-5 ml-2 text-[10px] font-bold text-white bg-[#1b7cf5] rounded-full">
                                            {chat.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </main>

            {userRole === 'client' ? <ClientBottomNav /> : <ProfessionalBottomNav />}
        </div>
    );

    const ChatRoomScreen = () => {
        const chat = activeChat || {
            id: 'temp',
            participant: selectedPro || MOCK_PROS[0],
            messages: [
                { id: 't1', senderId: 'other', text: `Olá! Sou o ${(selectedPro || MOCK_PROS[0]).name}. Como posso te ajudar hoje?`, timestamp: '09:15' },
                { id: 't2', senderId: 'me', text: 'Olá! Gostaria de um orçamento para a pintura da minha sala de estar. Seria possível?', timestamp: '09:17' }
            ]
        };
        const [newMessage, setNewMessage] = useState('');

        const handleSend = async () => {
            if (!newMessage.trim() || !session?.user) return;

            const text = newMessage;
            setNewMessage('');

            // OPTIMISTIC UPDATE: Add the message to the UI immediately
            const tempId = 'temp-' + Date.now();
            const optimisticMsg: MessageType = {
                id: tempId,
                senderId: session.user.id,
                text: text,
                timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            };
            setActiveChatMessages(prev => [...prev, optimisticMsg]);

            let chatId = activeChat?.id;

            // If it's a temp chat (new conversation), create the chat first
            if (!chatId) {
                console.log('[Chat] Creating new chat thread with:', chat.participant.id);
                const targetId = chat.participant.id;
                const { data: newChat, error: chatError } = await supabase
                    .from('chats')
                    .insert({
                        sender_id: session.user.id,
                        receiver_id: targetId,
                        last_message: text,
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (chatError) {
                    console.error('[Chat] Chat creation error:', chatError);
                    alert('Erro ao iniciar conversa: ' + chatError.message);
                    setNewMessage(text);
                    return;
                }
                console.log('[Chat] New chat created successfully:', newChat.id);
                chatId = newChat.id;
                setActiveChatId(chatId);
            }

            console.log('[Chat] Sending message to chat:', chatId);
            const { error: msgError } = await supabase
                .from('messages')
                .insert({
                    chat_id: chatId,
                    sender_id: session.user.id,
                    text: text
                });

            if (msgError) {
                console.error('[Chat] Message send error:', msgError);
                alert('Erro ao enviar mensagem: ' + msgError.message);
                setNewMessage(text);
                // Remove optimistic message on error
                setActiveChatMessages(prev => prev.filter(m => m.id !== tempId));
            } else {
                console.log('[Chat] Message sent successfully');
                // Update chat timestamp and last message
                await supabase
                    .from('chats')
                    .update({
                        last_message: text,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', chatId);
            }
        };

        return (
            <div className="min-h-screen bg-[#101822] flex flex-col">
                <header className="px-4 py-3 pt-12 bg-[#1f2937]/95 backdrop-blur-md border-b border-gray-800 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <button onClick={() => goBack()} className="text-[#1b7cf5] p-1">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => {
                                if (chat.participant.role === 'professional') {
                                    setSelectedPro(chat.participant as Professional);
                                    navigate('pro_profile');
                                } else {
                                    navigate('client_profile');
                                }
                            }}
                        >
                            <div className="relative">
                                <img src={chat.participant.avatar} className="w-10 h-10 rounded-full object-cover border border-[#1b7cf5]/20 group-hover:border-[#1b7cf5] transition-colors" alt="Avatar" />
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1f2937] rounded-full"></div>
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-white group-hover:text-[#1b7cf5] transition-colors">{chat.participant.name}</h1>
                                <span className="text-[10px] text-[#1b7cf5] font-bold uppercase tracking-wider">Online agora</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <MoreVertical className="text-gray-500 w-5 h-5" />
                    </div>
                </header>

                <main className="flex-1 p-4 space-y-6 overflow-y-auto no-scrollbar">
                    <div className="flex justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 bg-gray-800/40 px-3 py-1 rounded-full">Hoje</span>
                    </div>

                    {activeChatMessages.map(msg => (
                        <div key={msg.id} className={`flex items-end gap-2 max-w-[85%] ${msg.senderId === session?.user?.id ? 'ml-auto flex-row-reverse' : ''}`}>
                            <div className={`p-3 rounded-2xl border ${msg.senderId === session?.user?.id
                                ? 'bg-[#1b7cf5] text-white rounded-br-none border-[#1b7cf5] shadow-lg shadow-[#1b7cf5]/10'
                                : 'bg-[#1f2937] text-gray-200 rounded-bl-none border-gray-800'
                                }`}>
                                <p className="text-sm leading-relaxed">{msg.text}</p>
                                <span className={`text-[9px] mt-1 block text-right ${msg.senderId === session?.user?.id ? 'text-white/70' : 'text-gray-600'}`}>{msg.timestamp}</span>
                            </div>
                        </div>
                    ))}
                </main>

                <footer className="p-4 bg-[#101822] border-t border-gray-800 pb-10">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Digite sua mensagem..."
                                className="w-full bg-[#1f2937] border-none rounded-xl py-3.5 px-4 text-white focus:ring-1 focus:ring-[#1b7cf5] text-sm"
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            className="bg-[#1b7cf5] text-white p-3 rounded-xl shadow-lg shadow-[#1b7cf5]/20"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </footer>
            </div>
        );
    };

    const EditProfileScreen = () => {
        const [name, setName] = useState(currentUser.name);
        const [location, setLocation] = useState(currentUser.location || '');
        const [email, setEmail] = useState(currentUser.email);
        const [bio, setBio] = useState((currentUser as Professional).bio || '');
        const [specialty, setSpecialty] = useState((currentUser as Professional).specialty || '');
        const [workerType, setWorkerType] = useState((currentUser as Professional).workerType || 'professional');
        const [avatar, setAvatar] = useState(currentUser.avatar || '');
        const [isSaving, setIsSaving] = useState(false);
        const fileInputRef = useRef<HTMLInputElement>(null);

        const handleSave = async (e: React.FormEvent) => {
            e.preventDefault();
            setIsSaving(true);

            const updates = {
                id: currentUser.id,
                full_name: name,
                location,
                email,
                bio,
                specialty,
                worker_type: userRole === 'professional' ? workerType : null,
                avatar_url: avatar,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', currentUser.id);

            if (error) {
                alert('Erro ao salvar perfil: ' + error.message);
            } else {
                setCurrentUser(prev => ({
                    ...prev,
                    name,
                    location,
                    email,
                    bio,
                    specialty,
                    workerType: userRole === 'professional' ? workerType : null,
                    avatar
                }));
                navigate(userRole === 'professional' ? 'professional_home' : 'client_home');
            }
            setIsSaving(false);
        };

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setAvatar(reader.result as string);
                };
                reader.readAsDataURL(file);
            }
        };


        return (
            <div className="min-h-screen bg-[#101822] pb-24">
                <header className="px-6 pt-16 pb-4 flex items-center justify-between sticky top-0 bg-[#101822]/90 backdrop-blur-md z-30">
                    <button onClick={() => goBack()} className="text-gray-400">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold text-white">Editar Perfil</h1>
                    <button onClick={() => logout()} className="text-red-500">
                        <LogOut className="w-5 h-5" />
                    </button>
                </header>

                <main className="px-6 pt-6 space-y-8">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <img src={avatar} className="w-32 h-32 rounded-full object-cover border-4 border-[#1f2937] shadow-xl" alt="Profile" />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-1 right-1 bg-[#1b7cf5] text-white p-2.5 rounded-full border-4 border-[#101822] shadow-lg"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                        <p className="mt-4 text-sm font-medium text-gray-500">Toque para alterar a foto</p>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-400 ml-1">Nome Completo</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[#1f2937] border-none rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-[#1b7cf5]"
                                />
                                <UserIcon className="absolute right-5 top-1/2 -translate-y-1/2 text-[#1b7cf5] w-5 h-5" />
                            </div>
                        </div>


                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-400 ml-1">{userRole === 'professional' ? 'Endereço Comercial / Atendimento' : 'Sua Localização'}</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder={userRole === 'professional' ? 'Ex: Rua Augusta, 1000' : 'Sua cidade ou bairro'}
                                    className="w-full bg-[#1f2937] border-none rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-[#1b7cf5]"
                                />
                                <MapPin className="absolute right-5 top-1/2 -translate-y-1/2 text-[#1b7cf5] w-5 h-5" />
                            </div>
                        </div>

                        {userRole === 'professional' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-400 ml-1">Sua Especialidade</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={specialty}
                                            onChange={(e) => setSpecialty(e.target.value)}
                                            placeholder="Ex: Eletricista Residencial"
                                            className="w-full bg-[#1f2937] border-none rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-[#1b7cf5]"
                                        />
                                        <Briefcase className="absolute right-5 top-1/2 -translate-y-1/2 text-[#1b7cf5] w-5 h-5" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-400 ml-1">Biografia Profissional</label>
                                    <textarea
                                        rows={4}
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Conte sobre sua experiência e diferenciais..."
                                        className="w-full bg-[#1f2937] border-none rounded-3xl p-6 text-white focus:ring-2 focus:ring-[#1b7cf5] resize-none"
                                    />
                                </div>
                                <div className="space-y-4 pt-4">
                                    <label className="text-sm font-semibold text-gray-400 ml-1">Tipo de Atuação</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setWorkerType('professional')}
                                            className={`py-4 rounded-xl border font-bold transition-all ${workerType === 'professional' ? 'bg-[#1b7cf5] border-[#1b7cf5] text-white shadow-lg shadow-[#1b7cf5]/20' : 'bg-[#1f2937] border-gray-800 text-gray-400'}`}
                                        >
                                            Profissional
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setWorkerType('autonomous')}
                                            className={`py-4 rounded-xl border font-bold transition-all ${workerType === 'autonomous' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-[#1f2937] border-gray-700 text-gray-400'}`}
                                        >
                                            Autônomo
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-400 ml-1">E-mail de Contato</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#1f2937] border-none rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-[#1b7cf5]"
                                />
                                <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`w-full ${isSaving ? 'bg-gray-600' : 'bg-[#1b7cf5]'} text-white font-bold py-4 rounded-xl shadow-lg shadow-[#1b7cf5]/20 flex items-center justify-center gap-2 active:scale-95 transition-all`}
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <Check className="w-5 h-5" />
                            )}
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>

                        <button
                            type="button"
                            onClick={() => logout()}
                            className="w-full bg-red-500/10 text-red-500 font-bold py-4 rounded-xl border border-red-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all mt-4"
                        >
                            <LogOut className="w-5 h-5" /> Sair da Conta
                        </button>
                    </form>
                </main>
                {userRole === 'client' ? <ClientBottomNav /> : <ProfessionalBottomNav />}
            </div>
        );
    };

    const CompleteProfileScreen = () => {
        console.log('[App] Rendering CompleteProfileScreen');
        const [name, setName] = useState('');
        const [role, setRole] = useState<UserRole>(userRole || 'client');
        const [workerType, setWorkerType] = useState<'professional' | 'autonomous'>('professional');
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [error, setError] = useState<string | null>(null);

        const handleComplete = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!session?.user) return;
            setIsSubmitting(true);
            setError(null);

            try {
                const { data: profile, error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                        id: session.user.id,
                        full_name: name,
                        role: role,
                        worker_type: role === 'professional' ? workerType : null,
                        email: session.user.email
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;

                if (profile) {
                    console.log('[CompleteProfile] Profile created, syncing metadata for role:', role);
                    // Update user metadata as well to keep them in sync
                    const { error: metaError } = await supabase.auth.updateUser({
                        data: { role: role }
                    });

                    if (metaError) console.error('[CompleteProfile] Metadata sync error:', metaError);

                    setUserRole(profile.role);
                    setCurrentUser({
                        ...profile,
                        name: profile.full_name || 'User',
                        avatar: profile.avatar_url || (profile.role === 'professional' ? 'https://picsum.photos/seed/pro-default/200/200' : 'https://picsum.photos/seed/user-default/200/200'),
                    } as any);
                    navigate(profile.role === 'client' ? 'client_home' : 'professional_home', { reset: true, ignoreGuards: true });
                }
            } catch (err: any) {
                console.error('Error completing profile:', err);
                setError(err.message || 'Erro ao salvar perfil.');
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <div className="min-h-screen bg-[#101822] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[#1f2937] rounded-3xl p-8 border border-gray-800 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-[#1b7cf5]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <UserIcon className="w-8 h-8 text-[#1b7cf5]" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Complete seu Perfil</h1>
                        <p className="text-gray-400 text-sm mt-2">Só mais um passo para começar</p>
                    </div>

                    <form onSubmit={handleComplete} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Como deseja usar o App?</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setRole('client')}
                                    className={`py-4 rounded-xl border font-bold transition-all ${role === 'client' ? 'bg-[#1b7cf5] border-[#1b7cf5] text-white shadow-lg shadow-[#1b7cf5]/20' : 'bg-[#111827] border-gray-700 text-gray-400 hover:border-gray-600'}`}
                                >
                                    Cliente
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('professional')}
                                    className={`py-4 rounded-xl border font-bold transition-all ${role === 'professional' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-[#111827] border-gray-700 text-gray-400 hover:border-gray-600'}`}
                                >
                                    Profissional
                                </button>
                            </div>
                        </div>

                        {role === 'professional' && (
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Tipo de Atuação</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setWorkerType('professional')}
                                        className={`py-4 rounded-xl border font-bold transition-all ${workerType === 'professional' ? 'bg-[#1b7cf5] border-[#1b7cf5] text-white shadow-lg shadow-[#1b7cf5]/20' : 'bg-[#111827] border-gray-700 text-gray-400 hover:border-gray-600'}`}
                                    >
                                        Empresa
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setWorkerType('autonomous')}
                                        className={`py-4 rounded-xl border font-bold transition-all ${workerType === 'autonomous' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-[#111827] border-gray-700 text-gray-400 hover:border-gray-600'}`}
                                    >
                                        Autônomo
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Seu Nome Completo</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="João da Silva"
                                className="w-full bg-[#111827] border border-gray-700 rounded-xl py-3.5 px-4 text-white focus:ring-2 focus:ring-[#1b7cf5] transition-all"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !name.trim()}
                            className="w-full bg-[#1b7cf5] hover:bg-[#1b7cf5]/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Concluir <Rocket className="w-5 h-5" /></>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => logout()}
                            className="w-full py-2 text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
                        >
                            Sair da Conta
                        </button>
                    </form>
                </div>
            </div>
        );
    };

    const ManagePortfolioScreen = () => {
        const photoInputRef = useRef<HTMLInputElement>(null);
        const videoInputRef = useRef<HTMLInputElement>(null);
        const [portfolio, setPortfolio] = useState((currentUser as Professional).portfolio || []);

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const newItem: PortfolioItem = {
                        id: Math.random().toString(36).substr(2, 9),
                        title: `Novo ${type === 'image' ? 'Trabalho' : 'Vídeo'}`,
                        imageUrl: reader.result as string,
                        type: type,
                        caption: ''
                    };
                    setPortfolio(prev => [newItem, ...prev]);
                };
                reader.readAsDataURL(file);
            }
        };

        const handleUpdateItem = (id: string, field: string, value: string) => {
            setPortfolio(prev => prev.map(item => item.id === id ? { ...item, [field]: value.slice(0, 100) } : item));
        };

        const handleSave = () => {
            setCurrentUser(prev => ({
                ...prev,
                portfolio
            }));
            navigate('professional_home');
        };

        return (
            <div className="min-h-screen bg-[#101822] pb-24">
                <header className="px-6 pt-16 pb-4 flex items-center justify-between sticky top-0 bg-[#101822]/90 backdrop-blur-md z-30">
                    <button onClick={() => goBack()} className="text-[#1b7cf5]"><ArrowLeft className="w-6 h-6" /></button>
                    <h1 className="text-lg font-bold text-white">Gerenciar Portfólio</h1>
                    <div className="w-6"></div>
                </header>

                <main className="px-6 pt-6 space-y-8">
                    <section>
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Adicionar Novo Trabalho</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                onClick={() => photoInputRef.current?.click()}
                                className="aspect-square rounded-3xl border-2 border-dashed border-gray-800 bg-[#111827] flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-[#1b7cf5] transition-all"
                            >
                                <Camera className="text-[#1b7cf5] w-8 h-8" />
                                <span className="text-xs text-gray-500">Foto</span>
                                <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
                            </div>
                            <div
                                onClick={() => videoInputRef.current?.click()}
                                className="aspect-square rounded-3xl border-2 border-dashed border-gray-800 bg-[#111827] flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-[#1b7cf5] transition-all"
                            >
                                <Smartphone className="text-[#1b7cf5] w-8 h-8" />
                                <span className="text-xs text-gray-500">Vídeo</span>
                                <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={(e) => handleFileChange(e, 'video')} />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Seu Feed de Trabalhos</h2>
                        <div className="space-y-6">
                            {portfolio.map((item, index) => (
                                <div key={item.id} className="bg-[#1f2937] rounded-3xl overflow-hidden border border-gray-800 shadow-xl">
                                    <div className="relative aspect-video">
                                        {item.type === 'video' ? (
                                            <video src={item.imageUrl} className="w-full h-full object-cover" controls />
                                        ) : (
                                            <img
                                                src={item.imageUrl}
                                                className="w-full h-full object-cover cursor-pointer"
                                                alt={item.title}
                                                onClick={() => setViewerImage(item.imageUrl)}
                                            />
                                        )}
                                        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-full text-white cursor-pointer" onClick={() => setPortfolio(prev => prev.filter(p => p.id !== item.id))}>
                                            <Plus className="w-4 h-4 rotate-45" />
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div>
                                            <input
                                                type="text"
                                                value={item.title}
                                                onChange={(e) => handleUpdateItem(item.id, 'title', e.target.value)}
                                                placeholder="Título do trabalho"
                                                className="w-full bg-transparent text-white font-bold text-sm border-none focus:ring-0 p-0"
                                            />
                                            <textarea
                                                value={item.caption || ''}
                                                onChange={(e) => handleUpdateItem(item.id, 'caption', e.target.value)}
                                                placeholder="Adicione uma legenda..."
                                                className="w-full bg-transparent text-gray-400 text-xs border-none focus:ring-0 p-0 mt-1 resize-none"
                                                rows={2}
                                            />
                                            <div className="flex justify-between items-center mt-2">
                                                <p className="text-gray-600 text-[10px]">Postado em {new Date().toLocaleDateString('pt-BR')}</p>
                                                <span className="text-[10px] text-gray-600 font-bold">{(item.caption?.length || 0)}/100</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {portfolio.length === 0 && (
                                <div className="text-center py-12 bg-[#111827] rounded-3xl border border-dashed border-gray-800">
                                    <p className="text-gray-500 text-sm">Seu portfólio está vazio.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    <button
                        onClick={handleSave}
                        className="w-full bg-[#1b7cf5] text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2"
                    >
                        <Check className="w-5 h-5" /> Salvar Alterações
                    </button>
                </main>
                <ProfessionalBottomNav />
            </div>
        );
    };

    const SearchScreen = () => {
        const filteredPros = (professionals.length > 0 ? professionals : MOCK_PROS).filter(pro => {
            const matchesSearch = pro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pro.specialty.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesWorkerType = workerTypeFilter === 'all' || pro.workerType === workerTypeFilter;

            return matchesSearch && matchesWorkerType;
        });

        return (
            <div className="min-h-screen bg-[#101822] pb-24">
                <header className="px-6 pt-16 pb-4 bg-[#101822]/95 backdrop-blur-md sticky top-0 z-30 border-b border-gray-800">
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => { setSearchQuery(''); goBack(); }} className="text-[#1b7cf5]"><ArrowLeft className="w-6 h-6" /></button>
                        <h1 className="text-xl font-bold text-white">Buscar Serviços</h1>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 group-focus-within:text-[#1b7cf5] transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Busque por categoria ou profissional..."
                            className="w-full bg-[#111827] border border-gray-700 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-[#1b7cf5]"
                        />
                    </div>
                    <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setIsFilterModalOpen(true)}
                            className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${workerTypeFilter !== 'all' ? 'bg-[#1b7cf5] text-white' : 'bg-[#111827] text-gray-400 border border-gray-800'}`}
                        >
                            <Filter className="w-3 h-3" /> {workerTypeFilter === 'all' ? 'Filtros' : workerTypeFilter === 'professional' ? 'Profissional' : 'Autônomo'}
                        </button>
                        {['Elétrica', 'Limpeza', 'Pintura', 'Design'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSearchQuery(cat)}
                                className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold border transition-all ${searchQuery === cat ? 'bg-[#1b7cf5] text-white border-[#1b7cf5]' : 'bg-[#111827] text-gray-400 border-gray-800'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </header>

                <main className="px-6 pt-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">
                            {searchQuery ? `Resultados para "${searchQuery}"` : 'Serviços Próximos'}
                        </h3>
                        <span className="text-gray-500 text-xs font-medium">{filteredPros.length} resultados</span>
                    </div>

                    <div className="space-y-4">
                        {filteredPros.length > 0 ? (
                            filteredPros.map(pro => (
                                <div
                                    key={pro.id}
                                    onClick={() => { setSelectedPro(pro); navigate('pro_profile'); }}
                                    className="bg-[#1f2937] p-4 rounded-2xl border border-gray-800 hover:border-[#1b7cf5]/30 transition-all cursor-pointer group"
                                >
                                    <div className="flex gap-4">
                                        <img src={pro.avatar} className="w-20 h-20 rounded-xl object-cover" alt={pro.name} />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-white group-hover:text-[#1b7cf5] transition-colors">{pro.name}</h4>
                                                <div className="flex items-center text-yellow-500">
                                                    <Star className="w-3 h-3 fill-yellow-500 mr-1" />
                                                    <span className="text-xs font-bold text-gray-200">{pro.rating}</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">{pro.specialty}</p>
                                            <div className="flex items-center mt-3 gap-3">
                                                <span className="text-emerald-400 font-bold text-[10px] bg-emerald-400/10 px-2 py-0.5 rounded uppercase tracking-wider">Disponível hoje</span>
                                                <span className="text-[10px] text-gray-500 flex items-center">
                                                    <MapPin className="w-3 h-3 mr-1" /> 1.2 km
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20">
                                <div className="w-20 h-20 bg-[#111827] rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-800">
                                    <Search className="text-gray-600 w-8 h-8" />
                                </div>
                                <h4 className="text-white font-bold">Nenhum resultado encontrado</h4>
                                <p className="text-gray-500 text-sm mt-1">Tente buscar por outro termo ou categoria</p>
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="mt-6 text-[#1b7cf5] font-bold text-sm"
                                >
                                    Limpar busca
                                </button>
                            </div>
                        )}
                    </div>
                </main>

                <nav className="fixed bottom-0 left-0 right-0 bg-[#1f2937]/95 backdrop-blur-lg border-t border-gray-800 px-8 py-4 pb-8 flex justify-between items-center z-40">
                    <button onClick={() => navigate('client_home', { replace: true })} className="flex flex-col items-center gap-1 text-gray-500">
                        <Home className="w-6 h-6" />
                        <span className="text-[10px] font-bold">Início</span>
                    </button>
                    <button onClick={() => navigate('search', { replace: true })} className="flex flex-col items-center gap-1 text-[#1b7cf5]">
                        <Search className="w-6 h-6" />
                        <span className="text-[10px] font-bold">Buscar</span>
                    </button>
                    <button onClick={() => navigate('messages', { replace: true })} className="flex flex-col items-center gap-1 text-gray-500">
                        <MessageSquare className="w-6 h-6" />
                        <span className="text-[10px] font-bold">Mensagens</span>
                    </button>
                    <button onClick={() => navigate('notifications', { replace: true })} className="relative flex flex-col items-center gap-1 text-gray-500">
                        <Bell className="w-6 h-6" />
                        <span className="text-[10px] font-bold">Notificações</span>
                        <span className="absolute top-0 right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">3</span>
                    </button>
                    <button onClick={() => navigate('client_profile', { replace: true })} className="flex flex-col items-center gap-1 text-gray-500">
                        <UserIcon className="w-6 h-6" />
                        <span className="text-[10px] font-bold">Perfil</span>
                    </button>
                </nav>
            </div>
        );
    };

    const BookingScreen = () => (
        <div className="min-h-screen bg-[#101822] flex flex-col">
            <header className="px-6 pt-16 pb-4 flex items-center justify-between sticky top-0 bg-[#101822]/90 backdrop-blur-md z-30">
                <button onClick={() => goBack()} className="text-[#1b7cf5]"><ArrowLeft className="w-6 h-6" /></button>
                <h1 className="text-lg font-bold text-white">Agendamento</h1>
                <div className="w-6"></div>
            </header>

            <main className="flex-1 px-6 pt-6 space-y-8 overflow-y-auto no-scrollbar pb-32">
                <div className="flex items-center gap-4 bg-[#1f2937] p-4 rounded-2xl border border-gray-800">
                    <img src={selectedPro?.avatar || MOCK_PROS[0].avatar} className="w-16 h-16 rounded-xl object-cover" alt="Pro" />
                    <div>
                        <h2 className="text-white font-bold text-base leading-tight">{selectedPro?.specialty || 'Serviço'}</h2>
                        <p className="text-gray-400 text-xs mt-1">por {selectedPro?.name || 'Profissional'}</p>
                        <div className="flex items-center mt-1">
                            <Star className="text-[#1b7cf5] w-3 h-3 fill-[#1b7cf5] mr-1" />
                            <span className="text-[10px] font-bold text-white">{selectedPro?.rating || '5.0'}</span>
                        </div>
                    </div>
                </div>

                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold text-sm uppercase tracking-widest">Selecione a Data</h3>
                        <span className="text-[#1b7cf5] text-xs font-bold">Janeiro 2024</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        {[
                            { day: '15', label: 'SEG', status: 'red' },
                            { day: '16', label: 'TER', status: 'blue', active: true },
                            { day: '17', label: 'QUA', status: 'green' },
                            { day: '18', label: 'QUI', status: 'green' },
                            { day: '19', label: 'SEX', status: 'red' },
                        ].map((d, i) => (
                            <div
                                key={i}
                                className={`flex-shrink-0 w-16 h-20 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${d.active ? 'bg-[#1b7cf5] border-[#1b7cf5] text-white shadow-lg shadow-[#1b7cf5]/20' : 'bg-[#111827] border-gray-800'
                                    }`}
                            >
                                <span className={`text-[8px] font-bold ${d.active ? 'text-white/80' : 'text-gray-500'}`}>{d.label}</span>
                                <span className={`text-lg font-bold ${d.active ? 'text-white' : 'text-gray-300'}`}>{d.day}</span>
                                {!d.active && <div className={`w-full h-1 absolute bottom-0 rounded-b-2xl ${d.status === 'red' ? 'bg-red-500' : 'bg-emerald-500'}`} />}
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-4">Horários Disponíveis</h3>
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-[10px] uppercase font-bold text-gray-500 mb-3">Manhã</h4>
                            <div className="grid grid-cols-3 gap-3">
                                {['08:00', '09:30', '11:00'].map((t, i) => (
                                    <button key={t} className={`py-3 rounded-xl text-xs font-bold transition-all border ${i === 2 ? 'bg-[#1b7cf5] border-[#1b7cf5] text-white shadow-lg shadow-[#1b7cf5]/20' : 'bg-[#111827] border-gray-800 text-gray-400'
                                        }`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[10px] uppercase font-bold text-gray-500 mb-3">Tarde</h4>
                            <div className="grid grid-cols-3 gap-3">
                                {['13:30', '15:00', '16:30'].map((t, i) => (
                                    <button key={t} className={`py-3 rounded-xl text-xs font-bold transition-all border bg-[#111827] border-gray-800 text-gray-400 ${i === 2 ? 'opacity-30 cursor-not-allowed line-through' : ''
                                        }`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="p-6 bg-[#101822] border-t border-gray-800 fixed bottom-0 left-0 right-0 z-40">
                <button
                    onClick={() => navigate('client_home')}
                    className="w-full bg-[#1b7cf5] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#1b7cf5]/20 flex items-center justify-center gap-2"
                >
                    Confirmar Agendamento
                </button>
            </footer>
        </div>
    );

    const ReviewSubmissionScreen = () => {
        const [rating, setRating] = useState(0);
        const [comment, setComment] = useState('');
        const [isSubmitting, setIsSubmitting] = useState(false);

        const handleSubmit = async () => {
            if (rating === 0 || isSubmitting) return;
            setIsSubmitting(true);

            const targetProId = selectedPro?.id || 'pro1';

            const { data, error } = await supabase
                .from('reviews')
                .insert({
                    professional_id: targetProId,
                    user_id: currentUser.id,
                    rating,
                    comment
                })
                .select();

            if (error) {
                alert('Erro ao enviar avaliação: ' + error.message);
            } else {
                const newReview: Review = {
                    id: data[0].id,
                    professionalId: targetProId,
                    userId: currentUser.id,
                    userName: currentUser.name,
                    userAvatar: currentUser.avatar,
                    rating,
                    comment,
                    date: 'Agora'
                };

                setReviews(prev => [newReview, ...prev]);
                alert('Avaliação enviada com sucesso!');
                navigate('professional_reviews');
            }
            setIsSubmitting(false);
        };

        const getRatingText = () => {
            switch (rating) {
                case 1: return 'Péssimo';
                case 2: return 'Ruim';
                case 3: return 'Regular';
                case 4: return 'Muito bom!';
                case 5: return 'Excelente!';
                default: return 'Avalie sua experiência';
            }
        };

        return (
            <div className="min-h-screen bg-[#101822] flex flex-col items-center justify-center p-6">
                <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
                    <button onClick={() => goBack()} className="text-gray-500"><Plus className="rotate-45 w-6 h-6" /></button>
                    <h1 className="text-xs font-bold uppercase tracking-widest text-gray-500">Avaliação</h1>
                    <div className="w-6"></div>
                </header>

                <main className="w-full max-w-md flex flex-col items-center text-center">
                    <div className="relative mb-8">
                        <div className="absolute -inset-4 bg-[#1b7cf5]/20 rounded-full blur-2xl"></div>
                        <img src={selectedPro?.avatar || MOCK_PROS[0].avatar} className="relative w-28 h-28 rounded-full object-cover border-4 border-[#1f2937] shadow-xl" alt="Pro" />
                        <div className="absolute bottom-0 right-0 bg-[#1b7cf5] text-white p-1.5 rounded-full border-4 border-[#101822]">
                            <Check className="w-3 h-3" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-1">{selectedPro?.name || 'Usuário'}</h2>
                    {selectedPro?.specialty && (
                        <p className="text-[#1b7cf5] font-bold text-xs bg-[#1b7cf5]/10 px-3 py-1 rounded-full uppercase tracking-wider mb-10">
                            {selectedPro.specialty}
                        </p>
                    )}
                    {!selectedPro?.specialty && <div className="mb-10" />}

                    <p className="text-gray-400 font-medium mb-6">Como foi o atendimento?</p>
                    <div className="flex gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map(s => (
                            <button
                                key={s}
                                onClick={() => setRating(s)}
                                className="focus:outline-none active:scale-90 transition-transform"
                            >
                                <Star className={`w-10 h-10 ${s <= rating ? 'text-[#1b7cf5] fill-[#1b7cf5]' : 'text-gray-700'}`} />
                            </button>
                        ))}
                    </div>
                    <p className="text-[#1b7cf5] font-bold text-sm mb-10">{getRatingText()}</p>

                    <div className="w-full relative mb-12">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value.slice(0, 140))}
                            placeholder="Conte mais sobre sua experiência (opcional)..."
                            className="w-full bg-[#111827] border-none rounded-2xl p-4 text-white text-sm focus:ring-2 focus:ring-[#1b7cf5] resize-none h-32"
                        />
                        <span className="absolute bottom-3 right-4 text-[10px] text-gray-600 font-bold">{comment.length}/140</span>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={rating === 0}
                        className={`w-full font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 mb-4 transition-all ${rating === 0
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-[#1b7cf5] text-white shadow-[#1b7cf5]/20 active:scale-95'
                            }`}
                    >
                        Enviar Avaliação <Send className="w-4 h-4" />
                    </button>
                    <button onClick={() => navigate(userRole === 'client' ? 'client_home' : 'professional_home')} className="text-gray-500 font-bold text-sm">Pular</button>
                </main>
            </div>
        );
    };

    const EditScheduleScreen = () => {
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

        const changeMonth = (offset: number) => {
            const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
            setViewDate(newDate);
        };

        const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
        const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

        const toggleDay = (day: number) => {
            const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            if (availableDays.includes(dateStr)) {
                setAvailableDays(availableDays.filter(d => d !== dateStr));
                setUnavailableDays([...unavailableDays, dateStr]);
            } else if (unavailableDays.includes(dateStr)) {
                setUnavailableDays(unavailableDays.filter(d => d !== dateStr));
            } else {
                setAvailableDays([...availableDays, dateStr]);
            }
        };

        const toggleHour = (hour: string) => {
            if (activePeriod === 'morning') {
                setMorningHours(prev => prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour]);
            } else if (activePeriod === 'afternoon') {
                setAfternoonHours(prev => prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour]);
            } else {
                setEveningHours(prev => prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour]);
            }
        };

        const allPossibleHours = {
            morning: ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
            afternoon: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'],
            evening: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30']
        };

        const currentPeriodHours = activePeriod === 'morning' ? morningHours : activePeriod === 'afternoon' ? afternoonHours : eveningHours;

        return (
            <div className="min-h-screen bg-[#101822] pb-32">
                <header className="px-6 pt-16 pb-4 flex items-center justify-between sticky top-0 bg-[#101822]/90 backdrop-blur-md z-30">
                    <button onClick={() => goBack()} className="text-gray-400"><ArrowLeft className="w-6 h-6" /></button>
                    <h1 className="text-lg font-bold text-white">Editar Agenda</h1>
                    <MoreVertical className="text-gray-400 w-6 h-6" />
                </header>

                <main className="px-6 pt-6 space-y-8">
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</h2>
                            <div className="flex gap-4">
                                <button onClick={() => changeMonth(-1)} className="text-gray-600 hover:text-white transition-colors">
                                    <ArrowLeftCircle className="w-6 h-6" />
                                </button>
                                <button onClick={() => changeMonth(1)} className="text-gray-600 hover:text-white transition-colors">
                                    <ArrowLeftCircle className="w-6 h-6 rotate-180" />
                                </button>
                            </div>
                        </div>
                        <div className="bg-[#1f2937] rounded-3xl p-6 border border-gray-800 shadow-xl">
                            <div className="grid grid-cols-7 gap-y-4 text-center">
                                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                                    <span key={`${d}-${i}`} className="text-[10px] font-bold text-gray-600">{d}</span>
                                ))}
                                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                    <div key={`empty-${i}`} />
                                ))}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const isAvailable = availableDays.includes(dateStr);
                                    const isUnavailable = unavailableDays.includes(dateStr);
                                    const isToday = new Date().toDateString() === new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toDateString();

                                    return (
                                        <button
                                            key={day}
                                            onClick={() => toggleDay(day)}
                                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all relative mx-auto ${isAvailable ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]' :
                                                isUnavailable ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' :
                                                    isToday ? 'bg-[#1b7cf5] text-white shadow-[0_0_15px_rgba(27,124,245,0.5)]' :
                                                        'text-gray-500 hover:bg-gray-800'
                                                }`}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex justify-center gap-6 mt-8 pt-6 border-t border-gray-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Disponível</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Indisponível</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white">Horários Disponíveis</h2>
                            <div className="flex bg-[#111827] rounded-xl p-1 border border-gray-800">
                                {(['morning', 'afternoon', 'evening'] as const).map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => setActivePeriod(period)}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activePeriod === period ? 'bg-[#1b7cf5] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                                            }`}
                                    >
                                        {period === 'morning' ? 'Manhã' : period === 'afternoon' ? 'Tarde' : 'Noite'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-[#1f2937] rounded-3xl p-6 border border-gray-800 shadow-xl">
                            <div className="grid grid-cols-4 gap-3">
                                {allPossibleHours[activePeriod].map((hour) => {
                                    const isSelected = currentPeriodHours.includes(hour);
                                    return (
                                        <button
                                            key={hour}
                                            onClick={() => toggleHour(hour)}
                                            className={`py-3 rounded-xl text-xs font-bold transition-all border ${isSelected
                                                ? 'bg-[#1b7cf5]/10 border-[#1b7cf5] text-[#1b7cf5] shadow-[0_0_15px_rgba(27,124,245,0.1)]'
                                                : 'bg-[#111827] border-gray-800 text-gray-500 hover:border-gray-700'
                                                }`}
                                        >
                                            {hour}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-6 flex items-center gap-3 bg-[#111827] p-4 rounded-2xl border border-gray-800">
                                <div className="w-10 h-10 rounded-full bg-[#1b7cf5]/10 flex items-center justify-center">
                                    <Clock className="text-[#1b7cf5] w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Selecionado</p>
                                    <p className="text-sm text-white font-medium">{currentPeriodHours.length} horários na {activePeriod === 'morning' ? 'manhã' : activePeriod === 'afternoon' ? 'tarde' : 'noite'}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="p-6 bg-[#101822]/90 backdrop-blur-md border-t border-gray-800 fixed bottom-0 left-0 right-0 z-40">
                    <button
                        onClick={() => {
                            alert('Alterações salvas com sucesso!');
                        }}
                        className="w-full bg-[#1b7cf5] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#1b7cf5]/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                        <Check className="w-5 h-5" /> Salvar Alterações
                    </button>
                </footer>
            </div>
        );
    };

    const FilterModal = () => (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end justify-center"
                onClick={() => setIsFilterModalOpen(false)}
            >
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="w-full bg-[#1f2937] rounded-t-[40px] p-8 pb-12 max-w-lg border-t border-white/10"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="w-12 h-1.5 bg-gray-800 rounded-full mx-auto mb-8" />
                    <h2 className="text-2xl font-bold text-white mb-2 text-center">Filtros de Busca</h2>
                    <p className="text-gray-400 text-center mb-10">Refine os resultados para encontrar o que precisa.</p>

                    <div className="space-y-6 mb-10">
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Tipo de Prestador</label>
                            <div className="flex flex-col gap-3">
                                {[
                                    { id: 'all', label: 'Todos os tipos', icon: <Grid className="w-4 h-4" /> },
                                    { id: 'professional', label: 'Empresa / Profissional', icon: <Briefcase className="w-4 h-4" /> },
                                    { id: 'autonomous', label: 'Autônomo Freelance', icon: <UserIcon className="w-4 h-4" /> }
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => {
                                            setWorkerTypeFilter(type.id as any);
                                            setIsFilterModalOpen(false);
                                        }}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${workerTypeFilter === type.id
                                            ? 'bg-[#1b7cf5] border-[#1b7cf5] text-white shadow-lg shadow-[#1b7cf5]/20'
                                            : 'bg-[#111827] border-gray-800 text-gray-400 hover:border-gray-700'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${workerTypeFilter === type.id ? 'bg-white/20' : 'bg-[#1f2937]'}`}>
                                            {type.icon}
                                        </div>
                                        <span className="font-bold">{type.label}</span>
                                        {workerTypeFilter === type.id && <CheckCircle2 className="w-5 h-5 ml-auto" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsFilterModalOpen(false)}
                        className="w-full bg-[#1f2937] text-white font-bold py-4 rounded-2xl border border-gray-700 active:scale-95 transition-all"
                    >
                        Fechar
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );

    const ClientProfileScreen = () => {
        const chat = activeChat || { participant: selectedPro || MOCK_PROS[0] };
        return (
            <div className="min-h-screen bg-[#101822] pb-24">
                <header className="px-6 pt-16 pb-4 flex items-center justify-between sticky top-0 bg-[#101822]/90 backdrop-blur-md z-30">
                    <button onClick={() => goBack()} className="text-[#1b7cf5]"><ArrowLeft className="w-6 h-6" /></button>
                    <h1 className="text-lg font-bold text-white">Perfil do Cliente</h1>
                    <div className="w-6"></div>
                </header>

                <main className="px-6 pt-6 space-y-8">
                    <div className="flex flex-col items-center">
                        <img src={chat.participant.avatar} className="w-32 h-32 rounded-full object-cover border-4 border-[#1f2937] shadow-xl" alt="Profile" />
                        <h2 className="mt-4 text-2xl font-bold text-white">{chat.participant.name}</h2>
                        <div className="flex items-center gap-2 mt-1 text-gray-500">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">São Paulo, SP</span>
                        </div>
                    </div>

                    <section className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Informações de Contato</h3>
                        <div className="bg-[#1f2937] rounded-3xl p-6 border border-gray-800 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-[#1b7cf5]/10 p-3 rounded-2xl">
                                    <Mail className="text-[#1b7cf5] w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">E-mail</p>
                                    <p className="text-sm text-white font-medium">{chat.participant.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-[#1b7cf5]/10 p-3 rounded-2xl">
                                    <Smartphone className="text-[#1b7cf5] w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Telefone</p>
                                    <p className="text-sm text-white font-medium">(11) 98765-4321</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Histórico de Solicitações</h3>
                        <div className="bg-[#1f2937] rounded-3xl p-6 border border-gray-800 text-center py-12">
                            <p className="text-gray-500 text-sm">Nenhuma solicitação anterior encontrada.</p>
                        </div>
                    </section>

                    <button
                        onClick={() => {
                            setSelectedPro(chat.participant as any);
                            setIsReviewModalOpen(true);
                        }}
                        className="w-full bg-[#1b7cf5]/10 text-[#1b7cf5] font-bold py-4 rounded-2xl border border-[#1b7cf5]/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                        <Star className="w-5 h-5" /> Avaliar Cliente
                    </button>
                </main>
                <ClientBottomNav />
            </div>
        );
    };

    const ReviewModal = () => (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end justify-center"
                onClick={() => setIsReviewModalOpen(false)}
            >
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="w-full bg-[#1f2937] rounded-t-[40px] p-8 pb-12 max-w-lg border-t border-white/10"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="w-12 h-1.5 bg-gray-800 rounded-full mx-auto mb-8" />
                    <h2 className="text-2xl font-bold text-white mb-2 text-center">Avaliar Atendimento</h2>
                    <p className="text-gray-400 text-center mb-10">Sua opinião é fundamental para mantermos a qualidade dos serviços.</p>

                    <div className="space-y-6 mb-10">
                        <div className="space-y-2 text-left">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Seu Comentário</label>
                            <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Conte como foi o serviço..."
                                className="w-full bg-[#111827] border border-gray-800 rounded-2xl p-4 text-white text-sm focus:ring-2 focus:ring-[#1b7cf5] resize-none"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center block">Sua Nota</label>
                            <div className="flex justify-center gap-3">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button
                                        key={s}
                                        disabled={isSubmittingReview}
                                        onClick={async () => {
                                            if (!reviewComment.trim()) {
                                                alert('Por favor, escreva um comentário.');
                                                return;
                                            }
                                            setIsSubmittingReview(true);
                                            const targetProId = selectedPro?.id || 'pro1';

                                            const { data, error } = await supabase
                                                .from('reviews')
                                                .insert({
                                                    professional_id: targetProId,
                                                    user_id: currentUser.id,
                                                    rating: s,
                                                    comment: reviewComment
                                                })
                                                .select();

                                            if (error) {
                                                alert('Erro ao enviar avaliação: ' + error.message);
                                            } else {
                                                const newReviewFormatted: Review = {
                                                    id: data[0].id,
                                                    professionalId: targetProId,
                                                    userId: currentUser.id,
                                                    userName: currentUser.name,
                                                    userAvatar: currentUser.avatar,
                                                    rating: s,
                                                    comment: reviewComment,
                                                    date: 'Hoje'
                                                };
                                                setReviews(prev => [newReviewFormatted, ...prev]);
                                                setReviewComment('');
                                                setIsReviewModalOpen(false);
                                                alert('Avaliação enviada com sucesso!');
                                            }
                                            setIsSubmittingReview(false);
                                        }}
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isSubmittingReview ? 'opacity-50' : 'active:scale-90'} bg-[#111827] border border-gray-800 hover:border-[#1b7cf5] group`}
                                    >
                                        <Star className="text-gray-700 group-hover:text-yellow-500 group-hover:fill-yellow-500 w-6 h-6" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#111827] rounded-3xl p-6 border border-gray-800 mb-8">
                        <div className="flex items-center gap-4">
                            <img src={selectedPro?.avatar || MOCK_PROS[0].avatar} className="w-14 h-14 rounded-2xl object-cover" alt="Pro" />
                            <div>
                                <h3 className="text-white font-bold">{selectedPro?.name || 'Profissional'}</h3>
                                <p className="text-[#1b7cf5] text-xs font-bold uppercase tracking-wider">{selectedPro?.specialty || 'Serviço'}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsReviewModalOpen(false)}
                        className="w-full py-4 text-gray-500 font-bold hover:text-white transition-colors"
                    >
                        Pular avaliação
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );

    // Helper to translate common Supabase error messages
    const translateAuthError = (message: string) => {
        if (message.includes('rate limit') || message.includes('60 seconds')) return 'Aguarde 60 segundos antes de tentar novamente.';
        if (message.includes('not found')) return 'Usuário não encontrado.';
        if (message.includes('Invalid login')) return 'Credenciais inválidas.';
        if (message.includes('email link is invalid or has expired')) return 'O link de recuperação é inválido ou expirou.';
        if (message.includes('URL is not allowed')) return 'URL de redirecionamento não configurada no servidor.';
        if (message.includes('password should be different')) return 'A nova senha deve ser diferente da atual.';
        return 'Ocorreu um erro ao processar sua solicitação. Tente novamente.';
    };

    const ForgotPasswordScreen = () => {
        const [email, setEmail] = useState('');
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

        const handleResetRequest = async (e: React.FormEvent) => {
            e.preventDefault();
            setIsSubmitting(true);
            setMessage(null);

            try {
                // Remove redirectTo to let Supabase use its configured default Site URL, preventing 'URL not allowed' errors on Mobile/Capacitor
                const { error } = await supabase.auth.resetPasswordForEmail(email);
                if (error) throw error;
                setMessage({ type: 'success', text: 'E-mail de recuperação enviado! Verifique sua caixa de entrada.' });
            } catch (err: any) {
                setMessage({ type: 'error', text: translateAuthError(err.message || '') });
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <div className="min-h-screen bg-[#101822] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-[#1f2937] rounded-3xl overflow-hidden border border-gray-800 shadow-2xl relative"
                >
                    <button
                        onClick={() => navigate('login', { replace: true })}
                        className="absolute top-6 left-6 z-20 text-white/50 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>

                    <div className="h-48 bg-gradient-to-br from-[#1b7cf5] to-[#0891b2] flex flex-col items-center justify-center relative">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl ring-1 ring-white/20 mb-4 transform -rotate-3 overflow-hidden">
                            <Mail className="w-10 h-10 text-white drop-shadow-md" />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Recuperar Senha</h1>
                        <p className="text-white/70 text-sm mt-1">Enviaremos instruções para seu e-mail</p>
                    </div>

                    <div className="p-8">
                        <form onSubmit={handleResetRequest} className="space-y-6">
                            {message && (
                                <div className={`${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'} text-xs p-4 rounded-xl flex items-center gap-3`}>
                                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <Settings className="w-5 h-5 flex-shrink-0" />}
                                    <p>{message.text}</p>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">E-mail</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        className="w-full bg-[#111827] border border-gray-700 rounded-xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-[#1b7cf5] transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-[#1b7cf5] hover:bg-[#1b7cf5]/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-[#1b7cf5]/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Enviar Link <Send className="w-5 h-5" /></>
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        );
    };

    const ResetPasswordScreen = () => {
        const [password, setPassword] = useState('');
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

        const handlePasswordUpdate = async (e: React.FormEvent) => {
            e.preventDefault();
            setIsSubmitting(true);
            setMessage(null);

            if (password.length < 6) {
                setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
                setIsSubmitting(false);
                return;
            }

            try {
                const { error } = await supabase.auth.updateUser({ password });
                if (error) throw error;
                setMessage({ type: 'success', text: 'Senha alterada com sucesso! Redirecionando...' });

                // Clear the recovery session so they log in manually with the new credentials
                await supabase.auth.signOut();
                setTimeout(() => navigate('login', { replace: true, reset: true }), 2000);
            } catch (err: any) {
                setMessage({ type: 'error', text: translateAuthError(err.message || '') });
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <div className="min-h-screen bg-[#101822] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-[#1f2937] rounded-3xl overflow-hidden border border-gray-800 shadow-2xl relative"
                >
                    <div className="h-48 bg-gradient-to-br from-[#1b7cf5] to-[#0891b2] flex flex-col items-center justify-center relative">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl ring-1 ring-white/20 mb-4 transform rotate-3 overflow-hidden">
                            <Lock className="w-10 h-10 text-white drop-shadow-md" />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Nova Senha</h1>
                        <p className="text-white/70 text-sm mt-1">Defina sua nova credencial de acesso</p>
                    </div>

                    <div className="p-8">
                        <form onSubmit={handlePasswordUpdate} className="space-y-6">
                            {message && (
                                <div className={`${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'} text-xs p-4 rounded-xl flex items-center gap-3`}>
                                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <Settings className="w-5 h-5 flex-shrink-0" />}
                                    <p>{message.text}</p>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Nova Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-[#111827] border border-gray-700 rounded-xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-[#1b7cf5] transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-[#1b7cf5] hover:bg-[#1b7cf5]/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-[#1b7cf5]/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Redefinir Senha <CheckCircle2 className="w-5 h-5" /></>
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        );
    };

    const renderView = () => {
        console.log('[App] renderView currentView:', currentView, 'Session:', !!session);
        switch (currentView) {
            case 'splash': return <SplashScreen />;
            case 'role_selection': return <RoleSelectionScreen />;
            case 'login': return <LoginScreen />;
            case 'register': return <RegisterScreen />;
            case 'client_home': return <ClientHomeScreen />;
            case 'professional_home': return <ProfessionalHomeScreen />;
            case 'search': return <SearchScreen />;
            case 'pro_profile': return <ProfessionalProfileScreen />;
            case 'messages': return <MessagesScreen />;
            case 'chat_room': return <ChatRoomScreen />;
            case 'edit_profile': return <EditProfileScreen />;
            case 'edit_schedule': return <EditScheduleScreen />;
            case 'manage_portfolio': return <ManagePortfolioScreen />;
            case 'complete_profile': return <CompleteProfileScreen />;
            case 'booking': return <BookingScreen />;
            case 'client_profile': return <ClientProfileScreen />;
            case 'professional_reviews': return <ProfessionalReviewsScreen />;
            case 'review_submission': return <ReviewSubmissionScreen />;
            case 'forgot_password': return <ForgotPasswordScreen />;
            case 'reset_password': return <ResetPasswordScreen />;
            case 'notifications': return <NotificationsScreen />;
            default: return <LoginScreen />;
        }
    };

    return (
        <div className="relative min-h-screen bg-[#101822] text-white selection:bg-[#1b7cf5]/30">
            <div
                className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-700 pointer-events-none"
                style={{
                    backgroundImage: `url('src/bg_connection.png')`,
                    filter: 'brightness(0.3) contrast(1.1) saturate(1.2)'
                }}
            />
            <div className="relative z-10 min-h-screen">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentView + (activeChatId || '')}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="min-h-screen"
                    >
                        {renderView()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {viewerImage && (
                <div
                    className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 backdrop-blur-xl"
                    onClick={() => setViewerImage(null)}
                >
                    <button className="absolute top-12 right-6 text-white text-4xl">&times;</button>
                    <motion.img
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        src={viewerImage}
                        className="max-w-full max-h-[80vh] rounded-3xl shadow-2xl shadow-black/50 border border-white/5"
                        alt="Viewer"
                    />
                </div>
            )}

            {isReviewModalOpen && <ReviewModal />}
            {isFilterModalOpen && <FilterModal />}
        </div>
    );
}
