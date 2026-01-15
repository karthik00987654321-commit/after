
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
        );
      case 'stories':
        return (
          <div className="w-full max-w-6xl px-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
              <button onClick={() => { setView('categories'); setSearchQuery(''); }} className="flex items-center gap-2 text-[#434175]/60 hover:text-[#434175] transition-colors"><ArrowLeft className="w-4 h-4" /> Back</button>
              <h2 className="text-2xl font-serif italic text-[#434175]">{selectedCategory ? categories.find(c => c.id === selectedCategory)?.label : 'All shared paths'}</h2>
            </div>
            
            <div className="relative max-w-xl mb-16 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#434175]/30 group-focus-within:text-[#434175] transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search paths..."
                className="w-full pl-14 pr-6 py-5 bg-white border border-[#434175]/10 rounded-full outline-none focus:border-[#434175]/30 focus:shadow-sm transition-all text-lg italic font-light"
              />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredStories.map((story) => (
                <div key={story.id} className="relative group bg-white rounded-3xl overflow-hidden border border-[#434175]/5 hover:border-[#434175]/20 transition-all duration-500 shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.01]">
                  <div onClick={() => handleStoryClick(story)} className="cursor-pointer">
                    {story.image && <div className="aspect-[4/3] overflow-hidden bg-[#434175]/5"><img src={story.image} alt={story.title} className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" /></div>}
                    <div className="p-8 pb-20"><h3 className="text-2xl font-serif text-[#434175] mb-4">{story.title}</h3><p className="text-[#333333]/60 font-light leading-relaxed line-clamp-3 italic">{story.summary}</p></div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleShare(story); }} className="absolute bottom-6 right-8 p-3 bg-[#434175]/5 hover:bg-[#E9C46A]/20 rounded-full transition-all text-[#434175]/40 hover:text-[#434175]">
                    <Share2 size={18} />
                  </button>
                </div>
              ))}
              {filteredStories.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white/50 rounded-3xl border border-dashed border-[#434175]/10">
                  <p className="text-[#333333]/40 italic font-light">No shared paths matching your search.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'story-detail':
      case 'admin-story-preview': {
        const storyToDisplay = view === 'admin-story-preview' ? editingStory : selectedStory;
        if (!storyToDisplay) return null;
        return (
          <div className="w-full max-w-4xl px-6 animate-in fade-in duration-700">
            {view === 'admin-story-preview' && (
              <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-[#E9C46A] text-[#434175] px-6 py-2 rounded-full font-bold text-xs shadow-xl z-50 flex items-center gap-2 animate-bounce">
                <Eye size={14} /> Preview Mode
              </div>
            )}
            <div className="flex justify-between items-center mb-12">
              <button 
                onClick={() => setView(view === 'admin-story-preview' ? 'admin-editor' : 'stories')} 
                className="flex items-center gap-2 text-[#434175]/60 hover:text-[#434175] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {view === 'admin-story-preview' ? 'Back to Editor' : 'Back to paths'}
              </button>
              {view !== 'admin-story-preview' && (
                <button onClick={() => handleShare(storyToDisplay)} className="flex items-center gap-2 text-[#434175]/60 hover:text-[#434175] transition-colors text-sm"><Share2 size={16} /> Share path</button>
              )}
            </div>
            <h1 className="text-5xl md:text-7xl text-[#434175] font-serif mb-12 italic">{storyToDisplay.title || 'Untitled Path'}</h1>
            {storyToDisplay.image && <div className="mb-20 rounded-[3rem] overflow-hidden shadow-2xl"><img src={storyToDisplay.image} alt="" className="w-full aspect-video object-cover" /></div>}
            
            <div className="space-y-24 mb-32">
              <div><h4 className="text-xs uppercase tracking-widest text-[#434175]/40 font-bold mb-4">The slip</h4><p className="text-2xl md:text-3xl font-light text-[#333333]/80 leading-relaxed italic">{storyToDisplay.sections.slipped || '...'}</p></div>
              <div><h4 className="text-xs uppercase tracking-widest text-[#434175]/40 font-bold mb-4">What made it harder</h4><p className="text-2xl md:text-3xl font-light text-[#333333]/80 leading-relaxed italic">{storyToDisplay.sections.harder || '...'}</p></div>
              <div><h4 className="text-xs uppercase tracking-widest text-[#434175]/40 font-bold mb-4">The tiny thing that helped</h4><p className="text-2xl md:text-3xl font-light text-[#333333]/80 leading-relaxed italic">{storyToDisplay.sections.helped || '...'}</p></div>
              
              {/* Gallery Section */}
              {storyToDisplay.gallery && storyToDisplay.gallery.length > 0 && (
                <div className="space-y-16">
                  <h4 className="text-xs uppercase tracking-widest text-[#434175]/40 font-bold mb-4">Visual Journey</h4>
                  <div className="grid gap-12">
                    {storyToDisplay.gallery.map((item) => (
                      <div key={item.id} className="space-y-6 group">
                        <div className="rounded-[3rem] overflow-hidden shadow-xl border border-[#434175]/5 aspect-[4/3] bg-gray-50">
                          <img src={item.url} alt={item.caption} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        </div>
                        {item.caption && (
                          <p className="text-lg font-light text-[#333333]/60 italic pl-6 border-l-2 border-[#E9C46A]/30">
                            {item.caption}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div><h4 className="text-xs uppercase tracking-widest text-[#434175]/40 font-bold mb-4">Today</h4><p className="text-2xl md:text-3xl font-light text-[#333333]/80 leading-relaxed italic">{storyToDisplay.sections.today || '...'}</p></div>
            </div>
            
            <div className="mt-24 pt-24 border-t border-[#434175]/10 flex flex-col items-center pb-32">
              <Heart className="w-12 h-12 text-[#E9C46A] mb-8" />
              <h3 className="text-3xl font-serif text-[#434175] mb-6">Read enough for now?</h3>
              
              {storiesRead >= 1 && (
                <div className="mb-12 text-center animate-in fade-in duration-1000">
                  <p className="text-xl text-[#333333]/60 font-light italic mb-4">That’s enough for today.</p>
                  <button onClick={() => setView('entry')} className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#434175]/30 hover:text-[#434175] transition-colors">Come back another time</button>
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-4 mb-16">
                <button onClick={() => { setView('categories'); setSearchQuery(''); }} className="px-8 py-4 bg-[#434175] text-white rounded-full hover:bg-[#32305a] transition-all">Explore more paths</button>
                <button onClick={() => setView('steps')} className="px-8 py-4 border border-[#434175]/20 text-[#434175] rounded-full hover:bg-white transition-all">What can I do next?</button>
              </div>

              {/* Randomized grounding sentence matching advisory styling */}
              <p className="text-sm italic text-[#434175]/30 text-center animate-in fade-in duration-1000">
                {currentGroundingSentence}
              </p>
            </div>
          </div>
        );
      }
      case 'steps':
        return (
          <div className="w-full max-w-4xl px-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-4xl md:text-7xl text-[#434175] font-serif mb-16 italic">Tiny steps to breathe.</h2>
            <div className="space-y-6">
              {NEXT_STEPS.map((step, i) => (
                <div key={i} className="p-8 bg-white rounded-3xl border border-[#434175]/5 flex gap-6 items-center shadow-sm hover:border-[#E9C46A]/20 transition-all">
                  <span className="text-2xl font-serif text-[#E9C46A]">0{i+1}</span>
                  <p className="text-xl md:text-2xl font-light text-[#333333]/70">{step}</p>
                </div>
              ))}
            </div>
            <button onClick={() => { setView('categories'); setSearchQuery(''); }} className="mt-16 block mx-auto text-[#434175] font-medium underline underline-offset-8 decoration-[#E9C46A] decoration-2">Back to reading</button>
          </div>
        );
      case 'submit-guidelines':
        return (
          <div className="w-full max-w-4xl px-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32">
            <button onClick={() => setView('entry')} className="flex items-center gap-2 text-[#434175]/60 hover:text-[#434175] transition-colors mb-12"><ArrowLeft className="w-4 h-4" /> Go back</button>
            <h2 className="text-5xl md:text-7xl text-[#434175] font-serif mb-12 italic leading-tight">Your voice matters here.</h2>
            
            <div className="grid md:grid-cols-2 gap-12 mb-20">
              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-[#E9C46A]/20 rounded-2xl text-[#434175]"><ShieldCheck size={24} /></div>
                  <div>
                    <h4 className="text-xl font-serif text-[#434175] mb-2">Absolute Anonymity</h4>
                    <p className="text-[#333333]/60 font-light leading-relaxed">No accounts, no names, no tracking. We don't even store your IP address. Your path belongs only to you.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-[#E9C46A]/20 rounded-2xl text-[#434175]"><Heart size={24} /></div>
                  <div>
                    <h4 className="text-xl font-serif text-[#434175] mb-2">The Messy Middle</h4>
                    <p className="text-[#333333]/60 font-light leading-relaxed">We don't want "success" stories. We want the truth about the days you couldn't get up, and the tiny thing that eventually helped.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-[#E9C46A]/20 rounded-2xl text-[#434175]"><Sparkle size={24} /></div>
                  <div>
                    <h4 className="text-xl font-serif text-[#434175] mb-2">Quiet Reflection</h4>
                    <p className="text-[#333333]/60 font-light leading-relaxed">This is a slow place. Take your time writing. Your submission will be reviewed by our curators to ensure it stays a safe space for everyone.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-red-50 rounded-2xl text-red-400"><ShieldAlert size={24} /></div>
                  <div>
                    <h4 className="text-xl font-serif text-red-500 mb-2">Safety First</h4>
                    <p className="text-[#333333]/60 font-light leading-relaxed">Avoid sharing specific identifying details (places, companies, full names). We curate to protect the community from harmful content.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <button onClick={() => setView('submit')} className="px-12 py-5 bg-[#434175] text-white rounded-full text-lg font-medium shadow-lg hover:bg-[#32305a] transition-all transform hover:-translate-y-1">I understand, let me share</button>
              <p className="mt-6 text-sm text-[#333333]/40 italic font-light">Reading is also a form of participation.</p>
            </div>
          </div>
        );
      case 'submit':
        if (submissionSuccess) {
          return (
            <div className="text-center max-w-xl px-6 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-[#E9C46A] rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><ShieldCheck className="w-10 h-10 text-[#434175]" /></div>
              <h2 className="text-5xl font-serif text-[#434175] mb-6">Your voice is safe.</h2>
              <p className="text-xl text-[#333333]/60 font-light mb-12 italic">Thank you for sharing your path. It might be exactly what someone else needs to read today.</p>
              <button onClick={() => { setSubmissionSuccess(false); setView('categories'); setSearchQuery(''); }} className="px-12 py-4 bg-[#434175] text-white rounded-full shadow-lg">Return to paths</button>
            </div>
          );
        }
        return (
          <div className="w-full max-w-3xl px-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32">
            <button onClick={() => setView('submit-guidelines')} className="flex items-center gap-2 text-[#434175]/60 hover:text-[#434175] transition-colors mb-12"><ArrowLeft className="w-4 h-4" /> Guidelines</button>
            <h2 className="text-5xl font-serif text-[#434175] mb-4 italic">Share your path.</h2>
            <p className="text-xl text-[#333333]/60 font-light mb-12 italic">Everything is anonymous. No names, no accounts.</p>
            <form onSubmit={handleUserSubmit} className="space-y-12">
              <div className="space-y-4">
                <label className="text-sm uppercase tracking-widest text-[#434175]/40 font-bold italic">What was the slip?</label>
                <textarea required value={userSlip} onChange={(e) => setUserSlip(e.target.value)} placeholder="..." className="w-full p-8 bg-white border border-[#434175]/10 rounded-3xl min-h-[150px] outline-none font-light text-lg italic focus:border-[#434175]/30 transition-all" />
              </div>
              <div className="space-y-4">
                <label className="text-sm uppercase tracking-widest text-[#434175]/40 font-bold italic">The tiny thing that helped?</label>
                <textarea required value={userHelp} onChange={(e) => setUserHelp(e.target.value)} placeholder="..." className="w-full p-8 bg-white border border-[#434175]/10 rounded-3xl min-h-[150px] outline-none font-light text-lg italic focus:border-[#434175]/30 transition-all" />
              </div>

              <div className="space-y-4">
                <label className="text-sm uppercase tracking-widest text-[#434175]/40 font-bold italic">Visual memory (Optional)</label>
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => userInputFileRef.current?.click()}
                  className={`relative w-full aspect-[21/9] border-2 border-dashed rounded-[2rem] transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${isDragging ? 'border-[#E9C46A] bg-[#E9C46A]/5' : 'border-[#434175]/10 bg-white hover:border-[#434175]/20'}`}
                >
                  <input ref={userInputFileRef} type="file" hidden accept="image/*" onChange={handleUserImageUpload} />
                  
                  {userImage ? (
                    <>
                      <img src={userImage} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setUserImage(null); }} className="p-3 bg-white rounded-full text-red-400 shadow-xl hover:scale-110 transition-transform">
                          <X size={20} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-8 space-y-3">
                      <div className="w-16 h-16 bg-[#434175]/5 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <ImageIcon className="text-[#434175]/30" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[#434175] font-medium">Click to upload or drag & drop</p>
                        <p className="text-xs text-[#333333]/40 font-light italic">A photo that captures how you felt or what helped.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-6 bg-[#434175] text-white rounded-full text-xl font-medium shadow-xl hover:bg-[#32305a] transition-all">{isSubmitting ? 'Sending...' : 'Send my story'}</button>
            </form>
          </div>
        );
      case 'pitch-deck':
        return (
          <div className="fixed inset-0 z-50 bg-[#FDFBF7] flex flex-col items-center justify-center p-8 overflow-hidden">
            <header className="fixed top-0 left-0 right-0 p-8 flex justify-between items-center z-[60]">
               <button onClick={() => setView('entry')} className="p-3 hover:bg-[#434175]/5 rounded-full transition-colors flex items-center gap-2 text-[#434175]/60 hover:text-[#434175]">
                <ArrowLeft size={20} /> Close Deck
              </button>
              <div className="text-sm font-serif italic text-[#434175]/40">{currentSlide + 1} / {PITCH_SLIDES.length}</div>
            </header>
            <div className="w-full h-full flex items-center justify-center">
              <SlideContent slide={PITCH_SLIDES[currentSlide]} />
            </div>
            <Navigation 
              currentSlide={currentSlide} 
              totalSlides={PITCH_SLIDES.length} 
              onPrev={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              onNext={() => setCurrentSlide(Math.min(PITCH_SLIDES.length - 1, currentSlide + 1))}
              onGoto={setCurrentSlide}
            />
          </div>
        );
      case 'admin-login':
        return (
          <div className="w-full max-w-md px-6 animate-in zoom-in duration-500">
            <div className="text-center mb-8">
              <Lock className="w-12 h-12 text-[#434175]/20 mx-auto mb-4" />
              <h2 className="text-4xl font-serif text-[#434175]">Platform Login</h2>
              <p className="text-xs text-[#333333]/40 uppercase tracking-widest mt-2">Enter your role credentials</p>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <input 
                type="password" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
                placeholder="Access Password" 
                className="w-full p-5 rounded-2xl bg-white border border-[#434175]/10 outline-none focus:border-[#434175]/30 transition-all" 
              />
              {loginError && <p className="text-red-500 text-xs text-center">{loginError}</p>}
              <button type="submit" className="w-full py-4 bg-[#434175] text-white rounded-full font-medium shadow-md hover:bg-[#32305a] transition-all">Continue to Dashboard</button>
            </form>
          </div>
        );
      case 'admin-dashboard':
        return (
          <div className="w-full max-w-6xl px-6 animate-in fade-in duration-700 pb-32">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
              <div>
                <h2 className="text-4xl font-serif text-[#434175]">Admin Space</h2>
                <div className="flex items-center gap-2 mt-2">
                  <User size={12} className="text-[#E9C46A]" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#434175]/40">Role: {adminRole}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                {isSuperAdmin && (
                  <>
                    <button onClick={() => setView('admin-branding')} className="px-6 py-3 border border-[#434175]/10 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-[#434175]/5 transition-all">
                      <Palette size={18} /> Branding
                    </button>
                    <button onClick={() => setView('admin-roles')} className="px-6 py-3 border border-[#434175]/10 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-[#434175]/5 transition-all">
                      <Shield size={18} /> Roles
                    </button>
                  </>
                )}
                {canApprove && (
                  <button onClick={() => setView('admin-inbox')} className="px-6 py-3 border border-[#434175]/10 rounded-full text-sm font-bold flex items-center gap-2 relative hover:bg-[#434175]/5 transition-all">
                    <Inbox size={18} /> Inbox {submissions.length > 0 && <span className="ml-1 bg-[#E9C46A] px-1.5 rounded-full text-[10px]">{submissions.length}</span>}
                  </button>
                )}
                {canManageCategories && (
                  <button onClick={() => setView('admin-categories')} className="px-6 py-3 border border-[#434175]/10 rounded-full text-sm font-bold hover:bg-[#434175]/5 transition-all">
                    <Settings size={18} />
                  </button>
                )}
                {canEdit && (
                  <button onClick={createNewStory} className="px-6 py-3 bg-[#E9C46A] text-[#434175] rounded-full text-sm font-bold flex items-center gap-2 shadow-sm hover:shadow-md transition-all">
                    <Plus size={18} /> New Path
                  </button>
                )}
                <button onClick={() => { setIsLoggedIn(false); setAdminRole(null); setView('entry'); }} className="px-6 py-3 border border-red-100 text-red-400 rounded-full text-sm font-bold hover:bg-red-50 transition-all">
                  <LogOut size={18} />
                </button>
              </div>
            </div>
            <div className="grid gap-6">
              {stories.map(s => (
                <div key={s.id} className="p-8 bg-white border border-[#434175]/5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[#434175]/5 rounded-xl overflow-hidden flex items-center justify-center">{s.image ? <img src={s.image} className="w-full h-full object-cover" /> : <ImageIcon className="text-[#434175]/10" />}</div>
                    <div>
                      <h4 className="text-xl font-serif text-[#434175]">{s.title || 'Untitled'}</h4>
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-[#333333]/40">{categories.find(c => c.id === s.category)?.label}</p>
                        <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${s.isPublished ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {s.isPublished ? 'Live' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingStory(s); setView('admin-editor'); }} 
                      className={`p-2 transition-colors ${canEdit ? 'text-[#434175]/40 hover:text-[#434175]' : 'opacity-20 cursor-not-allowed'}`}
                      disabled={!canEdit}
                    >
                      <Edit3 size={18} />
                    </button>
                    {isSuperAdmin && (
                      <button onClick={() => deleteStory(s.id)} className="p-2 text-red-200 hover:text-red-500">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'admin-branding':
        if (!isSuperAdmin) return null;
        return (
          <div className="w-full max-w-4xl px-6 animate-in slide-in-from-bottom-8 duration-700 pb-32">
            <button onClick={() => setView('admin-dashboard')} className="mb-12 flex items-center gap-2 text-[#434175]/40 hover:text-[#434175] transition-all"><ArrowLeft size={16} /> Dashboard</button>
            <h2 className="text-4xl font-serif text-[#434175] mb-8">Site Identity</h2>
            <div className="bg-white p-12 rounded-[3rem] border border-[#434175]/5 shadow-sm space-y-12">
              <div className="space-y-4">
                <label className="text-[10px] uppercase font-bold text-[#434175]/40 tracking-[0.2em]">Website Name</label>
                <input 
                  type="text" 
                  value={branding.siteName} 
                  onChange={(e) => setBranding({ ...branding, siteName: e.target.value })} 
                  className="w-full p-6 text-4xl font-serif rounded-2xl border border-[#434175]/10 outline-none focus:border-[#434175]/30 transition-all"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] uppercase font-bold text-[#434175]/40 tracking-[0.2em]">Custom Logo Icon</label>
                <div className="flex items-center gap-8">
                  <div 
                    onClick={() => brandingLogoRef.current?.click()} 
                    className="w-24 h-24 rounded-full border-2 border-dashed border-[#434175]/10 flex items-center justify-center cursor-pointer hover:border-[#434175]/30 transition-all overflow-hidden bg-gray-50"
                  >
                    {branding.logoUrl ? (
                      <img src={branding.logoUrl} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen size={24} className="text-[#434175]/20" />
                    )}
                    <input ref={brandingLogoRef} type="file" hidden accept="image/*" onChange={handleBrandingLogoUpload} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#333333]/60 font-light italic text-sm">Upload a square image to replace the default book icon in the header.</p>
                    {branding.logoUrl && (
                      <button onClick={() => setBranding({ ...branding, logoUrl: undefined })} className="mt-2 text-[10px] uppercase font-bold text-red-300 hover:text-red-500 transition-colors">Reset to default</button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-8 border-t border-[#434175]/5">
                <label className="text-[10px] uppercase font-bold text-[#434175]/40 tracking-[0.2em]">Promo Video (Main Page)</label>
                <div 
                  onClick={() => brandingVideoRef.current?.click()}
                  className="w-full aspect-video rounded-[2rem] border-2 border-dashed border-[#434175]/10 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-[#434175]/20 transition-all overflow-hidden group relative"
                >
                  <input ref={brandingVideoRef} type="file" hidden accept="video/*" onChange={handleBrandingVideoUpload} />
                  {branding.promoVideoUrl ? (
                    <>
                      <video src={branding.promoVideoUrl} className="w-full h-full object-cover opacity-50" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/5 group-hover:bg-black/10 transition-colors">
                        <div className="p-4 bg-white rounded-full shadow-xl text-[#434175]">
                          <Play fill="currentColor" size={24} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-8 space-y-3">
                      <div className="w-16 h-16 bg-[#434175]/5 rounded-full flex items-center justify-center mx-auto text-[#434175]/20 group-hover:scale-110 transition-transform">
                        <Video size={32} />
                      </div>
                      <p className="text-sm font-medium text-[#434175]/60">Upload promo video from gallery</p>
                    </div>
                  )}
                </div>
                {branding.promoVideoUrl && (
                  <button onClick={() => setBranding({ ...branding, promoVideoUrl: undefined })} className="mt-2 text-[10px] uppercase font-bold text-red-300 hover:text-red-500 transition-colors">Remove Video</button>
                )}
              </div>
            </div>
          </div>
        );
      case 'admin-roles':
        return (
          <div className="w-full max-w-4xl px-6 animate-in slide-in-from-bottom-8 duration-700 pb-32">
            <button onClick={() => setView('admin-dashboard')} className="mb-12 flex items-center gap-2 text-[#434175]/40 hover:text-[#434175] transition-all"><ArrowLeft size={16} /> Dashboard</button>
            <h2 className="text-4xl font-serif text-[#434175] mb-8">Role Management</h2>
            
            <form onSubmit={addAdminUser} className="bg-white p-8 rounded-[2rem] border border-[#434175]/5 mb-12 shadow-sm space-y-6">
              <h3 className="text-xl font-serif text-[#434175]">Generate New Role</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <input required type="text" value={newRoleLabel} onChange={(e) => setNewRoleLabel(e.target.value)} className="p-4 rounded-xl border outline-none bg-gray-50 focus:bg-white transition-all" placeholder="Label (e.g. John Doe)" />
                <select value={newRoleType} onChange={(e) => setNewRoleType(e.target.value as AdminRole)} className="p-4 rounded-xl border outline-none bg-gray-50 focus:bg-white transition-all">
                  <option value="EDITOR">Content Editor</option>
                  <option value="APPROVER">Story Approver</option>
                  <option value="ADMIN">Secondary Admin</option>
                </select>
                <input required type="text" value={newRolePassword} onChange={(e) => setNewRolePassword(e.target.value)} className="p-4 rounded-xl border outline-none bg-gray-50 focus:bg-white transition-all" placeholder="Set Password" />
              </div>
              <button type="submit" className="w-full py-4 bg-[#434175] text-white rounded-xl font-bold hover:bg-[#32305a] transition-all flex items-center justify-center gap-2">
                <Plus size={18} /> Create Role Credentials
              </button>
            </form>

            <div className="grid gap-4">
              {adminUsers.map(user => (
                <div key={user.id} className="p-6 bg-white border border-[#434175]/5 rounded-3xl flex justify-between items-center group shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${user.role === 'ADMIN' ? 'bg-[#E9C46A]/20' : 'bg-[#434175]/5'}`}>
                      <User size={20} className={user.role === 'ADMIN' ? 'text-[#434175]' : 'text-[#434175]/40'} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#434175]">{user.label}</h4>
                      <div className="flex gap-3 items-center">
                        <span className="text-[9px] uppercase tracking-widest font-bold text-[#434175]/40 px-2 py-0.5 bg-gray-100 rounded-full">{user.role}</span>
                        <div className="flex items-center gap-1 text-[9px] text-gray-300">
                          <Key size={10} /> {user.password.replace(/./g, '•')}
                        </div>
                      </div>
                    </div>
                  </div>
                  {user.role !== 'ADMIN' && (
                    <button onClick={() => deleteAdminUser(user.id)} className="p-2 text-red-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'admin-inbox':
        if (!canApprove) return null;
        return (
          <div className="w-full max-w-4xl px-6 animate-in slide-in-from-bottom-8 duration-700 pb-32">
            <button onClick={() => setView('admin-dashboard')} className="mb-12 flex items-center gap-2 text-[#434175]/40 hover:text-[#434175] transition-all"><ArrowLeft size={16} /> Dashboard</button>
            <h2 className="text-4xl font-serif text-[#434175] mb-4">Submission Inbox</h2>
            <p className="text-sm text-[#333333]/40 mb-12 italic">Review and promote user stories into curated paths.</p>
            <div className="space-y-8">
              {submissions.map(sub => (
                <div key={sub.id} className="p-8 bg-white border border-[#434175]/5 rounded-3xl flex flex-col gap-6 shadow-sm hover:border-[#E9C46A]/30 transition-all group overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-[#434175]/30 uppercase tracking-[0.2em] font-bold">This happened some time ago.</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => promoteSubmission(sub)} className="p-3 bg-[#E9C46A]/20 text-[#434175] rounded-full hover:bg-[#E9C46A] transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <Sparkles size={14} /> Promote
                      </button>
                      <button onClick={() => discardSubmission(sub.id)} className="p-3 bg-red-50 text-red-300 hover:text-red-500 rounded-full transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  {sub.image && (
                    <div className="w-full h-48 overflow-hidden rounded-2xl bg-gray-50">
                      <img src={sub.image} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-8 pt-4 border-t border-[#434175]/5">
                    <div><h4 className="text-[10px] font-bold uppercase text-[#E9C46A] tracking-widest mb-3">The Slip</h4><p className="text-sm italic text-[#333333]/80 leading-relaxed">{sub.slipped}</p></div>
                    <div><h4 className="text-[10px] font-bold uppercase text-[#E9C46A] tracking-widest mb-3">Small Help</h4><p className="text-sm italic text-[#333333]/80 leading-relaxed">{sub.helped}</p></div>
                  </div>
                </div>
              ))}
              {submissions.length === 0 && (
                <div className="text-center py-24 bg-white/50 rounded-3xl border border-dashed border-[#434175]/10">
                  <Inbox className="w-12 h-12 mx-auto mb-4 text-[#434175]/10" />
                  <p className="text-[#333333]/40 font-light italic">The inbox is quiet. No new paths shared yet.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'admin-categories':
        if (!canManageCategories) return null;
        return (
          <div className="w-full max-w-4xl px-6 animate-in slide-in-from-bottom-8 duration-700 pb-32">
            <button onClick={() => setView('admin-dashboard')} className="mb-12 flex items-center gap-2 text-[#434175]/40"><ArrowLeft size={16} /> Dashboard</button>
            <h2 className="text-4xl font-serif text-[#434175] mb-8">Categories</h2>
            <div className="flex gap-4 mb-12">
              <input type="text" value={newCategoryLabel} onChange={(e) => setNewCategoryLabel(e.target.value)} className="flex-1 p-5 rounded-2xl bg-white border border-[#434175]/10 outline-none focus:border-[#434175]/20 transition-all" placeholder="New category label..." />
              <button onClick={addCategory} className="px-8 bg-[#434175] text-white rounded-2xl font-bold hover:bg-[#32305a] transition-all"><Plus /></button>
            </div>
            <div className="grid gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="p-6 bg-white border border-[#434175]/5 rounded-3xl flex justify-between items-center group shadow-sm">
                  {editingCategory?.id === cat.id ? (
                    <div className="flex-1 flex gap-4 mr-4">
                      <input 
                        type="text" 
                        value={editingCategory.label}
                        onChange={(e) => setEditingCategory({ ...editingCategory, label: e.target.value })}
                        className="flex-1 p-2 border-b-2 border-[#434175] outline-none"
                        autoFocus
                      />
                      <button onClick={saveCategoryEdit} className="p-2 text-green-500"><Check /></button>
                      <button onClick={() => setEditingCategory(null)} className="p-2 text-red-500"><X /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col">
                        <span className="text-lg font-serif text-[#434175]">{cat.label}</span>
                        <span className="text-[8px] uppercase tracking-widest text-[#434175]/30">ID: {cat.id}</span>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingCategory({ id: cat.id, label: cat.label })} className="p-2 text-[#434175]/40 hover:text-[#434175]"><Edit3 size={16} /></button>
                        <button onClick={() => deleteCategory(cat.id)} className="p-2 text-red-200 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'admin-editor':
        if (!editingStory) return null;
        return (
          <div className="w-full max-w-4xl px-6 animate-in slide-in-from-bottom-8 duration-700 pb-32">
            <button onClick={() => setView('admin-dashboard')} className="mb-12 flex items-center gap-2 text-[#434175]/40 hover:text-[#434175] transition-all"><ArrowLeft size={16} /> Dashboard</button>
            <form onSubmit={handleSaveStory} className="space-y-12">
              <div className="grid md:grid-cols-3 gap-12">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-[#434175]/40">Primary Cover Image</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()} 
                      className="group aspect-square bg-white border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer overflow-hidden relative border-[#434175]/10 hover:border-[#434175]/30 transition-all"
                    >
                      {editingStory.image ? (
                        <>
                          <img src={editingStory.image} className="w-full h-full object-cover rounded-3xl transition-transform group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload className="text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-6 text-[#434175]/20 group-hover:text-[#434175]/40 transition-colors">
                          <Upload size={32} className="mx-auto mb-2" />
                          <span className="text-xs font-medium">Set Cover</span>
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleImageUpload} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-[#434175]/40">Category</label>
                    <select value={editingStory.category} onChange={(e) => setEditingStory({...editingStory, category: e.target.value})} className="w-full p-4 rounded-xl border border-[#434175]/10 outline-none bg-white focus:border-[#434175]/30 transition-all font-medium text-sm text-[#434175]">{categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
                  </div>
                  {canApprove ? (
                    <label className="flex items-center gap-3 p-4 border border-[#434175]/5 rounded-xl cursor-pointer hover:bg-white transition-all shadow-sm">
                      <input type="checkbox" checked={editingStory.isPublished} onChange={(e) => setEditingStory({...editingStory, isPublished: e.target.checked})} className="w-5 h-5 accent-[#434175]" />
                      <span className="text-sm font-bold text-[#434175]">Publish Live</span>
                    </label>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">
                      <p>Publishing requires approval role</p>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-[#434175]/40">Headline</label>
                    <input required value={editingStory.title} onChange={(e) => setEditingStory({...editingStory, title: e.target.value})} placeholder="Title" className="w-full p-6 text-3xl font-serif rounded-2xl border border-[#434175]/10 outline-none focus:border-[#434175]/30 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-[#434175]/40">Preview Summary</label>
                    <textarea required value={editingStory.summary} onChange={(e) => setEditingStory({...editingStory, summary: e.target.value})} placeholder="Summary" className="w-full p-6 h-32 rounded-2xl border border-[#434175]/10 outline-none focus:border-[#434175]/30 transition-all italic font-light" />
                  </div>
                  
                  {Object.keys(editingStory.sections).map((key) => (
                    <div key={key} className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-[#434175]/40">{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                      <textarea 
                        required 
                        value={editingStory.sections[key as keyof typeof editingStory.sections]} 
                        onChange={(e) => setEditingStory({ ...editingStory, sections: { ...editingStory.sections, [key]: e.target.value }})} 
                        className="w-full p-6 min-h-[120px] rounded-2xl border border-[#434175]/10 outline-none focus:border-[#434175]/30 transition-all italic font-light" 
                      />
                    </div>
                  ))}

                  {/* Multiple Photos Gallery Management */}
                  <div className="space-y-6 pt-12 border-t border-[#434175]/5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs uppercase tracking-widest font-bold text-[#434175]/60 flex items-center gap-2">
                        <ImageIcon size={14} /> Story Gallery
                      </label>
                      <button 
                        type="button" 
                        onClick={() => galleryInputRef.current?.click()}
                        className="text-[10px] uppercase tracking-widest font-bold bg-[#434175]/5 hover:bg-[#E9C46A]/20 px-4 py-2 rounded-full transition-all text-[#434175]"
                      >
                        + Add Photo
                      </button>
                      <input ref={galleryInputRef} type="file" hidden accept="image/*" onChange={handleGalleryUpload} />
                    </div>
                    
                    <div className="grid gap-8">
                      {editingStory.gallery?.map((item, index) => (
                        <div key={item.id} className="bg-white border border-[#434175]/5 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row animate-in fade-in duration-500">
                          <div className="w-full md:w-1/3 aspect-[4/3] bg-gray-50 relative group">
                            <img src={item.url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all">
                              <button 
                                type="button" 
                                onClick={() => startProcessing(item.url, 4/3, (newUrl) => {
                                  setEditingStory(prev => {
                                    if (!prev) return null;
                                    const next = [...(prev.gallery || [])];
                                    next[index] = { ...next[index], url: newUrl };
                                    return { ...prev, gallery: next };
                                  });
                                })}
                                className="p-2 bg-white rounded-full text-[#434175] shadow-lg hover:scale-110"
                              >
                                <Crop size={16} />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => setEditingStory(prev => prev ? { ...prev, gallery: prev.gallery?.filter(g => g.id !== item.id) } : null)}
                                className="p-2 bg-white rounded-full text-red-500 shadow-lg hover:scale-110"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="flex-1 p-6 space-y-3">
                            <label className="text-[10px] uppercase font-bold text-[#434175]/30 flex items-center gap-2 italic">
                              <Type size={10} /> Photo Caption
                            </label>
                            <input 
                              type="text"
                              value={item.caption}
                              onChange={(e) => setEditingStory(prev => {
                                if (!prev) return null;
                                const next = [...(prev.gallery || [])];
                                next[index] = { ...next[index], caption: e.target.value };
                                return { ...prev, gallery: next };
                              })}
                              placeholder="Describe this moment..."
                              className="w-full p-4 bg-[#FDFBF7]/50 rounded-xl border border-transparent focus:border-[#E9C46A]/30 outline-none italic font-light text-sm"
                            />
                          </div>
                        </div>
                      ))}
                      {(!editingStory.gallery || editingStory.gallery.length === 0) && (
                        <div className="p-12 border-2 border-dashed border-[#434175]/10 rounded-3xl text-center">
                          <p className="text-[#333333]/30 font-light italic">No gallery photos added yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-12">
                    <button 
                      type="button" 
                      onClick={() => setView('admin-story-preview')}
                      className="flex-1 py-5 bg-white border border-[#434175]/20 text-[#434175] rounded-full text-xl font-medium shadow-sm hover:shadow-md hover:bg-[#434175]/5 transition-all flex items-center justify-center gap-2"
                    >
                      <Eye size={20} /> Preview
                    </button>
                    <button 
                      type="submit" 
                      className="flex-[2] py-5 bg-[#434175] text-white rounded-full text-xl font-medium shadow-xl hover:bg-[#32305a] transition-all transform hover:-translate-y-1"
                    >
                      {editingStory.isPublished ? 'Save Live' : 'Save Draft'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        );
      case 'about':
        return (
          <div className="w-full max-w-4xl px-6 animate-in fade-in pb-32">
            <div className="text-center mb-24">
              <h2 className="text-6xl md:text-8xl text-[#434175] font-serif mb-8 italic">The Philosophy of Silence</h2>
              <p className="text-2xl text-[#333333]/60 font-light italic max-w-2xl mx-auto">
                We built this space because the internet became too loud, too fast, and too performative.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-20 mb-32">
              <div className="space-y-8">
                <div className="w-16 h-16 bg-[#E9C46A]/20 rounded-3xl flex items-center justify-center text-[#434175]">
                  <Anchor size={24} />
                </div>
                <h3 className="text-4xl font-serif text-[#434175]">Against the Highlight Reel</h3>
                <p className="text-xl font-light text-[#333333]/70 leading-relaxed italic">
                  Traditional social platforms are optimized for the finish line—the trophy, the promotion, the "perfect" life. But most of life happens in the messy middle. <strong>AFTER</strong> is an intentional un-optimization. We don't want your results; we want your process.
                </p>
              </div>

              <div className="space-y-8">
                <div className="w-16 h-16 bg-[#434175]/5 rounded-3xl flex items-center justify-center text-[#434175]/40">
                  <Moon size={24} />
                </div>
                <h3 className="text-4xl font-serif text-[#434175]">The Right to Anonymity</h3>
                <p className="text-xl font-light text-[#333333]/70 leading-relaxed italic">
                  Vulnerability requires safety. By removing accounts, likes, and public metrics, we remove the pressure of the digital ego. Here, you are not a profile or a set of data points. You are simply a voice sharing a path.
                </p>
              </div>

              <div className="space-y-8">
                <div className="w-16 h-16 bg-[#434175]/5 rounded-3xl flex items-center justify-center text-[#434175]/40">
                  <Coffee size={24} />
                </div>
                <h3 className="text-4xl font-serif text-[#434175]">Radical Slow Time</h3>
                <p className="text-xl font-light text-[#333333]/70 leading-relaxed italic">
                  Our features are designed to slow you down. The "one story per visit" limiter and rotating grounding sentences are not restrictions—they are permissions. They are reminders that it is okay to stop scrolling and start reflecting.
                </p>
              </div>

              <div className="space-y-8">
                <div className="w-16 h-16 bg-[#E9C46A]/20 rounded-3xl flex items-center justify-center text-[#434175]">
                  <Sparkle size={24} />
                </div>
                <h3 className="text-4xl font-serif text-[#434175]">Human Ethics over Algorithms</h3>
                <p className="text-xl font-light text-[#333333]/70 leading-relaxed italic">
                  There is no AI deciding what you see. Every shared path is curated by human hands to ensure this remains a safe, ethical, and calm corner of the web. Silence and stability are more important to us than growth or engagement.
                </p>
              </div>
            </div>

            <div className="p-16 bg-white rounded-[4rem] border border-[#434175]/5 text-center shadow-sm">
              <h4 className="text-2xl font-serif text-[#434175] mb-6 italic">"The world can wait for a moment."</h4>
              <p className="text-lg font-light text-[#333333]/50 mb-12">
                AFTER is more than a tool; it's a collective deep breath. Thank you for being here, for moving slowly, and for letting nothing be broken.
              </p>
              <button onClick={() => setView('entry')} className="px-12 py-4 bg-[#434175] text-white rounded-full hover:bg-[#32305a] transition-all">Return to the start</button>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#333333] font-sans selection:bg-[#E9C46A]/30 flex flex-col">
      <div className="fixed top-[-10%] left-[-5%] w-[40%] aspect-square bg-[#E9C46A]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[40%] aspect-square bg-[#434175]/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Image Processing Modal */}
      {processingImage && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-500">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-serif text-[#434175]">Adjust Image</h3>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Crop & Scale</p>
              </div>
              <button onClick={() => setProcessingImage(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-gray-900"><X /></button>
            </div>
            
            <div className="p-8 bg-gray-50 flex flex-col items-center">
              <div 
                className="relative bg-white shadow-inner overflow-hidden border border-gray-200" 
                style={{ 
                  width: '100%', 
                  aspectRatio: processingImage.aspectRatio, 
                  maxWidth: '400px' 
                }}
              >
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ cursor: 'move' }}
                >
                  <img 
                    src={processingImage.url} 
                    alt="" 
                    className="max-w-none transition-all duration-300"
                    style={{ 
                      transform: `translate(${cropPos.x}px, ${cropPos.y}px) scale(${cropZoom})`,
                      pointerEvents: 'none'
                    }}
                  />
                  {/* Visual Crop Guide */}
                  <div className="absolute inset-0 pointer-events-none border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                </div>
              </div>
              
              <div className="w-full mt-12 space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#434175]/60 italic">
                    <span className="flex items-center gap-2"><Maximize size={10} /> Zoom Scale</span>
                    <span>{Math.round(cropZoom * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0.1" max="3" step="0.1" 
                    value={cropZoom} 
                    onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                    className="w-full h-1 bg-[#434175]/10 rounded-full appearance-none accent-[#434175]"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#434175]/60 flex items-center gap-2"><Move size={10} /> Offset X</label>
                    <input 
                      type="range" min="-300" max="300" 
                      value={cropPos.x} 
                      onChange={(e) => setCropPos({...cropPos, x: parseInt(e.target.value)})}
                      className="w-full h-1 bg-[#434175]/10 rounded-full appearance-none accent-[#434175]"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#434175]/60 flex items-center gap-2"><Move size={10} /> Offset Y</label>
                    <input 
                      type="range" min="-300" max="300" 
                      value={cropPos.y} 
                      onChange={(e) => setCropPos({...cropPos, y: parseInt(e.target.value)})}
                      className="w-full h-1 bg-[#434175]/10 rounded-full appearance-none accent-[#434175]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 flex gap-4">
              <button 
                onClick={() => setProcessingImage(null)} 
                className="flex-1 py-4 border border-gray-100 rounded-full font-bold text-gray-400 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  const processed = await processImage(
                    processingImage.url, 
                    processingImage.aspectRatio, 
                    1200,
                    -cropPos.x / cropZoom,
                    -cropPos.y / cropZoom,
                    cropZoom
                  );
                  processingImage.onComplete(processed);
                  setProcessingImage(null);
                }}
                className="flex-[2] py-4 bg-[#434175] text-white rounded-full font-bold shadow-xl hover:bg-[#32305a] transition-all flex items-center justify-center gap-2"
              >
                <Check size={18} /> Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="fixed top-0 left-0 right-0 z-40 px-8 py-6 flex justify-between items-center backdrop-blur-sm bg-[#FDFBF7]/80 border-b border-[#434175]/5">
        <div onClick={() => { setView('entry'); setSearchQuery(''); }} className="text-2xl font-serif text-[#434175] cursor-pointer flex items-center gap-2 hover:opacity-80 transition-opacity">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="" className="w-6 h-6 rounded-md object-cover" />
          ) : (
            <BookOpen size={20} className="text-[#E9C46A]" />
          )}
          <span className="flex items-center">
            {branding.siteName.replace('®', '')}
            <span className="text-[10px] align-top ml-0.5 mt-[-6px] font-sans font-bold opacity-60">®</span>
          </span>
        </div>
        <div className="flex gap-6 md:gap-8">
          <button onClick={() => setView(isLoggedIn ? 'admin-dashboard' : 'submit-guidelines')} className="text-xs uppercase tracking-widest font-bold text-[#434175]/60 hover:text-[#434175] transition-colors">{isLoggedIn ? 'Dashboard' : 'Share Path'}</button>
          <button onClick={() => setView('about')} className="text-xs uppercase tracking-widest font-bold text-[#434175]/60 hover:text-[#434175] transition-colors">About</button>
        </div>
      </header>
      
      <main className="flex-1 pt-32 pb-24 flex flex-col items-center justify-center relative z-10">
        {renderView()}
      </main>
      
      <footer className="py-12 px-8 text-center border-t border-[#434175]/5 relative z-10">
        <p className="text-xs tracking-widest text-[#434175]/30 uppercase mb-4 font-medium">A safe space for shared struggles.</p>
        <div className="flex gap-8 justify-center items-center">
          <button onClick={() => { setView('pitch-deck'); setCurrentSlide(0); }} className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#434175]/30 hover:text-[#434175]/60 transition-colors flex items-center gap-1">
            <Presentation size={12} /> Project Deck
          </button>
          <button onClick={() => setView(isLoggedIn ? 'admin-dashboard' : 'admin-login')} className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#434175]/30 hover:text-[#434175]/60 transition-colors">{isLoggedIn ? 'Platform' : 'Editor Access'}</button>
        </div>
      </footer>
    </div>
  );
};

export default App;
