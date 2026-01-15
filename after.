
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PageView, Story, Category, Submission, AdminRole, AdminUser, Branding, GalleryItem } from './types';
import { MOCK_STORIES, CATEGORIES as DEFAULT_CATEGORIES, NEXT_STEPS, PITCH_SLIDES } from './constants';
import { ArrowLeft, Heart, BookOpen, ShieldCheck, Lock, Edit3, Trash2, Plus, LogOut, Upload, Settings, Check, X, Inbox, Sparkles, Share2, Image as ImageIcon, Eye, User, Shield, Key, Palette, Search, ShieldAlert, Sparkle, Presentation, Video, Play, Crop, Maximize, Move, Type, Anchor, Coffee, Moon } from 'lucide-react';
import { Navigation } from './components/Navigation';
import { SlideContent } from './components/SlideContent';

const INITIAL_ADMIN_USERS: AdminUser[] = [
  { id: '1', role: 'ADMIN', password: 'sudeep@2006', label: 'Primary Admin' },
  { id: '2', role: 'EDITOR', password: 'editor123', label: 'Content Team' },
  { id: '3', role: 'APPROVER', password: 'approver123', label: 'Curator' }
];

const DEFAULT_BRANDING: Branding = {
  siteName: 'AFTER®',
  logoUrl: undefined,
  promoVideoUrl: undefined
};

const GROUNDING_SENTENCES = [
  "You’re allowed to move slowly.",
  "Nothing is broken.",
  "Your timing is not wrong.",
  "Deep breaths are productive too.",
  "The world can wait for a moment."
];

// --- Helper for Image Processing ---
const processImage = (
  source: string,
  aspectRatio: number,
  targetWidth: number,
  cropX: number,
  cropY: number,
  cropScale: number
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(source);

      const targetHeight = targetWidth / aspectRatio;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Fill background
      ctx.fillStyle = '#FDFBF7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Apply crop and scale
      const drawWidth = img.width * cropScale;
      const drawHeight = img.height * cropScale;
      
      ctx.drawImage(
        img,
        cropX, cropY, img.width, img.height,
        0, 0, canvas.width, canvas.height
      );

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = source;
  });
};

const App: React.FC = () => {
  const [view, setView] = useState<PageView>('entry');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Add-on States
  const [storiesRead, setStoriesRead] = useState(0);
  const [isReturningVisitor, setIsReturningVisitor] = useState(false);

  // Image Processing State
  const [processingImage, setProcessingImage] = useState<{
    url: string;
    onComplete: (processedUrl: string) => void;
    aspectRatio: number;
  } | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPos, setCropPos] = useState({ x: 0, y: 0 });

  // Randomized grounding sentence per visit to story detail
  const currentGroundingSentence = useMemo(() => {
    return GROUNDING_SENTENCES[Math.floor(Math.random() * GROUNDING_SENTENCES.length)];
  }, [selectedStory?.id, view]);

  // Branding State
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);

  // Admin States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [stories, setStories] = useState<Story[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ id: string, label: string } | null>(null);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  
  // Role Management State
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [newRoleType, setNewRoleType] = useState<AdminRole>('EDITOR');
  const [newRolePassword, setNewRolePassword] = useState('');

  // Submission Form State
  const [userSlip, setUserSlip] = useState('');
  const [userHelp, setUserHelp] = useState('');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const userInputFileRef = useRef<HTMLInputElement>(null);
  const brandingLogoRef = useRef<HTMLInputElement>(null);
  const brandingVideoRef = useRef<HTMLInputElement>(null);

  const isNight = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 20 || hour <= 6;
  }, []);

  useEffect(() => {
    try {
      const savedStories = localStorage.getItem('after_stories');
      const savedCategories = localStorage.getItem('after_categories');
      const savedSubmissions = localStorage.getItem('after_submissions');
      const savedAdminUsers = localStorage.getItem('after_admin_users');
      const savedBranding = localStorage.getItem('after_branding');
      const visitedBefore = localStorage.getItem('after_visited');

      if (visitedBefore) {
        setIsReturningVisitor(true);
      } else {
        localStorage.setItem('after_visited', 'true');
      }

      if (savedStories) setStories(JSON.parse(savedStories));
      else setStories(MOCK_STORIES.map(s => ({ ...s, isPublished: true, gallery: [] })));
      
      if (savedCategories) setCategories(JSON.parse(savedCategories));
      else setCategories(DEFAULT_CATEGORIES);
      
      if (savedSubmissions) setSubmissions(JSON.parse(savedSubmissions));
      
      if (savedAdminUsers) setAdminUsers(JSON.parse(savedAdminUsers));
      else setAdminUsers(INITIAL_ADMIN_USERS);

      if (savedBranding) setBranding(JSON.parse(savedBranding));
    } catch (e) {
      setStories(MOCK_STORIES.map(s => ({ ...s, isPublished: true, gallery: [] })));
      setCategories(DEFAULT_CATEGORIES);
      setAdminUsers(INITIAL_ADMIN_USERS);
    }
  }, []);

  useEffect(() => {
    if (stories.length > 0) localStorage.setItem('after_stories', JSON.stringify(stories));
  }, [stories]);

  useEffect(() => {
    if (categories.length > 0) localStorage.setItem('after_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('after_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    if (adminUsers.length > 0) localStorage.setItem('after_admin_users', JSON.stringify(adminUsers));
  }, [adminUsers]);

  useEffect(() => {
    localStorage.setItem('after_branding', JSON.stringify(branding));
  }, [branding]);

  useEffect(() => { 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
    if (view === 'story-detail') {
      setStoriesRead(prev => prev + 1);
    }
  }, [view]);

  // Permission Helpers
  const canEdit = adminRole === 'EDITOR' || adminRole === 'ADMIN';
  const canApprove = adminRole === 'APPROVER' || adminRole === 'ADMIN';
  const canManageCategories = adminRole === 'EDITOR' || adminRole === 'ADMIN';
  const isSuperAdmin = adminRole === 'ADMIN';

  const filteredStories = stories.filter(s => {
    const matchesCategory = selectedCategory ? s.category === selectedCategory : true;
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return s.isPublished && matchesCategory && matchesSearch;
  });

  const handleStoryClick = (story: Story) => {
    setSelectedStory(story);
    setView('story-detail');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = adminUsers.find(u => u.password === loginPassword);
    if (user) {
      setIsLoggedIn(true);
      setAdminRole(user.role);
      setView('admin-dashboard');
      setLoginError('');
      setLoginPassword('');
    } else {
      setLoginError('Invalid credentials.');
    }
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const newSubmission: Submission = {
      id: Date.now().toString(),
      slipped: userSlip,
      helped: userHelp,
      image: userImage || undefined,
      timestamp: Date.now()
    };
    setTimeout(() => {
      setSubmissions(prev => [newSubmission, ...prev]);
      setIsSubmitting(false);
      setSubmissionSuccess(true);
      setUserSlip('');
      setUserHelp('');
      setUserImage(null);
    }, 1500);
  };

  const handleShare = async (story: Story) => {
    const shareData = {
      title: `${branding.siteName} - ${story.title}`,
      text: story.summary,
      url: window.location.origin,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        alert('Link copied to clipboard');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const promoteSubmission = (sub: Submission) => {
    if (!canApprove) return;
    const newStory: Story = {
      id: `story-${sub.id}`,
      title: 'Shared Path',
      summary: sub.slipped.substring(0, 100) + '...',
      category: categories[0]?.id || 'uncategorized',
      image: sub.image,
      sections: { slipped: sub.slipped, harder: 'Shared by a visitor.', helped: sub.helped, today: 'Still unfolding.' },
      gallery: [],
      isPublished: false
    };
    setEditingStory(newStory);
    setSubmissions(prev => prev.filter(s => s.id !== sub.id));
    setView('admin-editor');
  };

  const discardSubmission = (id: string) => { 
    if (!canApprove) return;
    if (window.confirm('Discard this submission?')) setSubmissions(prev => prev.filter(s => s.id !== id)); 
  };

  const handleSaveStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStory || !canEdit) return;
    const newStories = [...stories];
    const index = newStories.findIndex(s => s.id === editingStory.id);
    if (index !== -1) newStories[index] = { ...editingStory };
    else newStories.push({ ...editingStory });
    setStories(newStories);
    setView('admin-dashboard');
    setEditingStory(null);
  };

  // --- Image Processing Workflow ---
  const startProcessing = (source: string, aspectRatio: number, onComplete: (processedUrl: string) => void) => {
    setProcessingImage({ url: source, aspectRatio, onComplete });
    setCropZoom(1);
    setCropPos({ x: 0, y: 0 });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        startProcessing(reader.result as string, 16/9, (processedUrl) => {
          setEditingStory(prev => prev ? { ...prev, image: processedUrl } : null);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        startProcessing(reader.result as string, 4/3, (processedUrl) => {
          setEditingStory(prev => {
            if (!prev) return null;
            const newGallery = [...(prev.gallery || [])];
            newGallery.push({
              id: Date.now().toString(),
              url: processedUrl,
              caption: ''
            });
            return { ...prev, gallery: newGallery };
          });
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBrandingLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBranding(prev => ({ ...prev, logoUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleBrandingVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBranding(prev => ({ ...prev, promoVideoUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleUserImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processUserFile(file);
  };

  const processUserFile = (file: File | undefined | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setUserImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processUserFile(file);
  };

  const createNewStory = () => {
    if (!canEdit) return;
    setEditingStory({
      id: Date.now().toString(),
      title: '',
      summary: '',
      category: categories[0]?.id || '',
      image: '',
      sections: { slipped: '', harder: '', helped: '', today: '' },
      gallery: [],
      isPublished: false
    });
    setView('admin-editor');
  };

  const deleteStory = (id: string) => { 
    if (!isSuperAdmin) return;
    if (window.confirm('Delete this story?')) setStories(stories.filter(s => s.id !== id)); 
  };

  const addCategory = () => {
    if (!newCategoryLabel.trim() || !canManageCategories) return;
    setCategories([...categories, { id: newCategoryLabel.toLowerCase().replace(/\s+/g, '-'), label: newCategoryLabel.trim() }]);
    setNewCategoryLabel('');
  };

  const deleteCategory = (id: string) => {
    if (!canManageCategories) return;
    if (categories.length <= 1) return alert("At least one category must exist.");
    if (window.confirm('Delete category? Stories will be reassigned.')) {
      const remainingCats = categories.filter(c => c.id !== id);
      setCategories(remainingCats);
      setStories(stories.map(s => s.category === id ? { ...s, category: remainingCats[0].id } : s));
    }
  };

  const saveCategoryEdit = () => {
    if (!editingCategory || !editingCategory.label.trim() || !canManageCategories) return;
    setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, label: editingCategory.label } : c));
    setEditingCategory(null);
  };

  // Role Management
  const addAdminUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    const newUser: AdminUser = {
      id: Date.now().toString(),
      label: newRoleLabel,
      role: newRoleType,
      password: newRolePassword
    };
    setAdminUsers([...adminUsers, newUser]);
    setNewRoleLabel('');
    setNewRolePassword('');
  };

  const deleteAdminUser = (id: string) => {
    if (!isSuperAdmin) return;
    if (adminUsers.find(u => u.id === id)?.role === 'ADMIN') {
       return alert("Cannot delete main admin account.");
    }
    setAdminUsers(adminUsers.filter(u => u.id !== id));
  };

  const renderView = () => {
    switch (view) {
      case 'entry':
        return (
          <div className="flex flex-col items-center text-center max-w-2xl px-6 animate-in fade-in duration-1000">
            {isReturningVisitor && (
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#434175]/30 mb-8 animate-in fade-in duration-700">Welcome back. Nothing changed.</p>
            )}
            <h1 className="text-6xl md:text-8xl text-[#434175] font-serif leading-tight mb-8 italic">When life didn’t go as planned, this is what people did next.</h1>
            <p className="text-xl md:text-2xl text-[#333333]/60 font-light mb-12 max-w-lg mx-auto">
              No motivation. No fake success.<br />
              {isNight ? 'It’s okay to rest here.' : 'Take your time.'}
            </p>
            
            <div className="relative w-full group">
              {branding.promoVideoUrl ? (
                <div className="w-full aspect-video rounded-[2rem] overflow-hidden mb-12 shadow-2xl bg-black/5 border border-[#434175]/5 relative">
                  <video src={branding.promoVideoUrl} controls className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-700" />
                  {isLoggedIn && isSuperAdmin && (
                    <button 
                      onClick={() => setView('admin-branding')} 
                      className="absolute top-6 right-6 p-3 bg-white/90 backdrop-blur rounded-full text-[#434175] shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                      title="Edit Branding"
                    >
                      <Palette size={18} />
                    </button>
                  )}
                </div>
              ) : isLoggedIn && isSuperAdmin ? (
                <div 
                  onClick={() => setView('admin-branding')}
                  className="w-full aspect-video rounded-[2rem] border-2 border-dashed border-[#434175]/10 bg-[#434175]/5 mb-12 flex flex-col items-center justify-center cursor-pointer hover:border-[#434175]/30 hover:bg-[#434175]/10 transition-all group"
                >
                  <Video className="w-12 h-12 text-[#434175]/20 group-hover:scale-110 transition-transform mb-4" />
                  <p className="text-[#434175]/40 font-bold uppercase tracking-widest text-xs">Admin: Upload Promo Video</p>
                </div>
              ) : null}
            </div>

            <button onClick={() => setView('categories')} className="px-12 py-5 bg-[#434175] text-[#FDFBF7] rounded-full text-lg font-medium hover:bg-[#32305a] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">Explore the paths</button>
            <p className="mt-8 text-sm text-[#333333]/40 tracking-widest uppercase font-medium">Just reading is enough.</p>
          </div>
        );
      case 'categories':
        return (
          <div className="w-full max-w-4xl px-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-4xl md:text-7xl text-[#434175] font-serif mb-4 italic">What’s weighing on you?</h2>
            <p className="text-xl text-[#333333]/60 font-light mb-16 italic">Take what fits. You don’t need to explain.</p>
            <div className="grid gap-6">
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setView('stories'); setSearchQuery(''); }} className="w-full p-12 text-left bg-white rounded-[3rem] border border-[#434175]/5 hover:border-[#434175]/20 hover:shadow-sm transition-all group">
                  <span className="text-2xl md:text-4xl text-[#333333]/80 group-hover:text-[#434175] transition-colors flex items-center justify-between">{cat.label}<ArrowLeft className="w-8 h-8 opacity-0 group-hover:opacity-100 rotate-180 transition-all" /></span>
                </button>
              ))}
              <button onClick={() => setView('entry')} className="flex items-center gap-2 text-[#434175]/60 hover:text-[#434175] transition-colors mt-8"><ArrowLeft className="w-4 h-4" /> Back to start</button>
            </div>
          </div>
       
