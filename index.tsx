// FIX: Add imports for React and ReactDOM
import React from 'react';
import ReactDOM from 'react-dom/client';

// ============== services/apiService.ts ==============
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwYpSV3UBL_zD1zmvX5xHSHBCWX_Rv7L9eUCNeHzVQc_Kv-pqEHDwHFtAvzXUJgzpw5Ow/exec";

async function handleApiResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (!result.success) {
        console.error("API Error:", result.error);
        throw new Error(result.error || 'An unknown API error occurred');
    }
    return result.data;
}

async function callApi(action, payload) {
    const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, payload })
    });
    return handleApiResponse(response);
}

class ReadingLogAPI {
  // FIX: Made statuses parameter optional to allow fetching all books.
  async getBooks(statuses?) { return callApi('getBooks', { statuses: statuses?.join(',') }); }
  async getBookById(id) { return callApi('getBookById', { id }); }
  async addBook(data) { return callApi('addBook', data); }
  async updateBook(bookId, data) { return callApi('updateBook', { bookId, data }); }
  async deleteBook(bookId) { return callApi('deleteBook', { bookId }); }
  // FIX: Made limit parameter optional and provided a default value safely.
  async getQuotes(limit?) { return callApi('getQuotes', { limit: limit === undefined ? 50 : limit }); }
  async getQuotesByBookId(bookId) { return callApi('getQuotesByBookId', { bookId }); }
  async addQuote(data) { return callApi('addQuote', data); }
  async updateQuote(quoteId, data) { return callApi('updateQuote', { quoteId, data }); }
  async deleteQuote(quoteId) { return callApi('deleteQuote', { quoteId }); }
  async addBookReview(data) { return callApi('addBookReview', data); }
  async setReadingGoal(year, month, target) { return callApi('setReadingGoal', { year, month, target }); }
  async getReadingGoalProgress(year, month) { return callApi('getReadingGoalProgress', { year, month }); }
  // FIX: Provided empty payload for API calls that don't require one.
  async getCompletedBooksStats() { return callApi('getCompletedBooksStats', {}); }
  // FIX: Provided empty payload for API calls that don't require one.
  async getDetailedStats() { return callApi('getDetailedStats', {}); }
}

const apiService = new ReadingLogAPI();


// ============== services/geminiService.ts ==============
const getBookRecommendation = async ( existingBooks ) => {
   try {
    const recommendation = await callApi('getBookRecommendation', { existingBooks });
    return recommendation;
  } catch (error) {
    console.error("Error getting recommendation:", error);
    throw new Error("AI 추천 생성 중 오류가 발생했습니다.");
  }
};

// ============== utils/helpers.ts ==============
const formatDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return '';
    return dateString.split('T')[0];
};

// ============== components/ui.tsx ==============
// FIX: React was used but not defined/imported. The import at the top of the file fixes this.
const { useRef, useImperativeHandle, forwardRef } = React;

const BookOpenIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);
const ChartBarIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
);
const SparklesIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10.868 2.884c.321-.772.117-1.623-.458-2.11L10 0l-.41.774c-.575.487-.779 1.338-.458 2.11L10.868 2.884zM12.5 5.5a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2a.5.5 0 01.5-.5zM8.5 5.5a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2a.5.5 0 01.5-.5zM5 7.5a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2a.5.5 0 01.5-.5zM15 7.5a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2a.5.5 0 01.5-.5zM2.884 9.132c.772.321 1.623.117 2.11-.458L5.774 8.25l-.774.41c-.487.575-1.338.779-2.11.458L2.884 9.132zM17.116 9.132c-.772.321-1.623.117-2.11-.458L14.226 8.25l.774.41c.487.575 1.338.779 2.11.458l.01.02zM9.132 17.116c.321-.772.117-1.623-.458-2.11L8.25 14.226l-.41.774c-.575.487-.779 1.338-.458 2.11l.02.01zM10.868 17.116c-.321-.772-.117-1.623.458-2.11l.41-.774.41.774c.575.487.779 1.338.458 2.11l-.02.01z" clipRule="evenodd" />
    </svg>
);
const PencilIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 19.82a2.25 2.25 0 01-1.272.772l-4.5 1.5a.75.75 0 01-.928-.928l1.5-4.5a2.25 2.25 0 01.772-1.272l9.056-9.056z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.875 4.5" />
    </svg>
);
const CalendarIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 12.75h.008v.008H12v-.008z" />
  </svg>
);
const SearchIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);
const TrashIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);
const PlusCircleIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const BookmarkIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.5 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
);
const TagIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
);

// FIX: Made children prop optional with a default value.
const Modal = ({ isOpen, onClose, title, children = null }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8 animate-slide-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};
const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-10">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
);
const EmptyState = ({ title, message, action }) => (
    <div className="text-center p-8 bg-slate-100 rounded-xl border border-dashed border-slate-300">
        <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
        <p className="text-slate-500 mt-2">{message}</p>
        {action && <div className="mt-6">{action}</div>}
    </div>
);
// FIX: Made onClick prop optional by providing a default value.
// FIX: Explicitly type Card as a React Functional Component to fix issues with `children` and `key` props.
const Card: React.FC<{ children?: React.ReactNode, className?: string, onClick?: any }> = ({ children, className = '', onClick = null }) => (
    <div
        className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-blue-300' : ''} ${className}`}
        onClick={onClick}
    >
        {children}
    </div>
);
const Button = forwardRef(
    ({ children, variant = 'primary', isLoading = false, className = '', ...props }, ref) => {
        const baseClasses = "inline-flex items-center justify-center font-semibold rounded-lg px-5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
        const variantClasses = {
            primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
            secondary: 'bg-slate-600 text-white hover:bg-slate-700 focus:ring-slate-500',
            danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
            success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
        };
        return (
            <button ref={ref} className={`${baseClasses} ${variantClasses[variant]} ${className}`} disabled={isLoading || props.disabled} {...props}>
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        처리 중...
                    </>
                ) : (
                    children
                )}
            </button>
        );
    }
);
const Input = forwardRef(({ label, id, type, className, ...props }, ref) => {
    const internalRef = useRef(null);
    useImperativeHandle(ref, () => internalRef.current);
    const showPicker = () => {
        if (internalRef.current?.showPicker) {
            internalRef.current.showPicker();
        }
    };
    const handleContainerClick = () => {
        if (type === 'date' && internalRef.current) {
            internalRef.current.focus();
        }
    };
    return (
        <div className="mb-4">
            <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <div 
                className={`relative ${type === 'date' ? 'cursor-pointer' : ''}`} 
                onClick={handleContainerClick}
            >
                <input
                    ref={internalRef}
                    id={id}
                    type={type}
                    className={`block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
                               focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                               ${type === 'date' ? 'pr-10' : ''} ${className}`}
                    onFocus={() => { if (type === 'date') showPicker(); }}
                    {...props}
                />
                {type === 'date' && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-slate-400" />
                    </div>
                )}
            </div>
        </div>
    );
});
const Textarea = forwardRef(({ label, id, ...props }, ref) => (
     <div className="mb-4">
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <textarea ref={ref} id={id} rows={4} className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" {...props} />
    </div>
));
const Select = forwardRef(({ label, id, children, ...props }, ref) => (
     <div className="mb-4">
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <select ref={ref} id={id} className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" {...props}>
            {children}
        </select>
    </div>
));
const SearchInput = forwardRef(({ className, ...props }, ref) => (
    <div className={`relative w-full ${className}`}>
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="w-5 h-5 text-slate-400" />
        </div>
        <input
            ref={ref}
            type="search"
            className="block w-full p-3 pl-10 text-base text-slate-900 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500 transition"
            {...props}
        />
    </div>
));
// FIX: Made className prop optional with a default value.
const ProgressBar = ({ progress, className = "" }) => (
    <div className={`w-full bg-slate-200 rounded-full h-2.5 ${className}`}>
        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
    </div>
);
// FIX: Explicitly type TagBadge as a React Functional Component to fix issues with `key` prop.
const TagBadge: React.FC<{ tag: any }> = ({ tag }) => (
    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
        #{tag}
    </span>
);

// ============== components/charts.tsx ==============
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const MonthlyProgressChart = ({ data }) => {
  if (!(window as any).Recharts) {
    return (
        <div className="h-80 flex items-center justify-center p-4 text-center">
            <Card className="!border-red-300">
                <h3 className="font-bold text-red-600">오류: 차트 라이브러리 로딩 실패</h3>
                <p className="text-slate-600 mt-2">차트를 표시하는 데 필요한 Recharts 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인하고 페이지를 새로고침 해주세요.</p>
            </Card>
        </div>
    );
  }
  // FIX: Cast window to `any` to access Recharts library which is loaded via script tag.
  const { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } = (window as any).Recharts;
  if (!data || data.length === 0) {
    return (
        <div className="h-80 flex items-center justify-center">
            {/* FIX: Provided null for the action prop when not used. */}
            <EmptyState title="월별 데이터 없음" message="책을 완독하면 월별 진행 상황을 볼 수 있습니다." action={null} />
        </div>
    );
  }
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
          <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
          <Tooltip contentStyle={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '0.5rem' }} />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          <Bar dataKey="books" fill="#3b82f6" name="읽은 권수" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
const RatingDistributionChart = ({ data }) => {
    if (!(window as any).Recharts) {
        return (
            <div className="h-80 flex items-center justify-center p-4 text-center">
                <Card className="!border-red-300">
                    <h3 className="font-bold text-red-600">오류: 차트 라이브러리 로딩 실패</h3>
                    <p className="text-slate-600 mt-2">차트를 표시하는 데 필요한 Recharts 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인하고 페이지를 새로고침 해주세요.</p>
                </Card>
            </div>
        );
    }
    // FIX: Cast window to `any` to access Recharts library which is loaded via script tag.
    const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } = (window as any).Recharts;
    if (!data || data.length === 0) {
        return (
            <div className="h-80 flex items-center justify-center">
                {/* FIX: Provided null for the action prop when not used. */}
                <EmptyState title="평점 데이터 없음" message="평점이 포함된 서평을 추가하면 분포도를 볼 수 있습니다." action={null} />
            </div>
        );
    }
    return (
        <div className="h-80 w-full">
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return (percent * 100) > 5 ? (
                                <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                    {`%${(percent * 100).toFixed(0)}`}
                                </text>
                            ) : null;
                        }}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};
const TagDistributionChart = ({ data }) => {
    if (!(window as any).Recharts) {
        return (
            <div className="h-80 flex items-center justify-center p-4 text-center">
                <Card className="!border-red-300">
                    <h3 className="font-bold text-red-600">오류: 차트 라이브러리 로딩 실패</h3>
                    <p className="text-slate-600 mt-2">차트를 표시하는 데 필요한 Recharts 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인하고 페이지를 새로고침 해주세요.</p>
                </Card>
            </div>
        );
    }
    // FIX: Cast window to `any` to access Recharts library which is loaded via script tag.
    const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } = (window as any).Recharts;
    if (!data || data.length === 0) {
        return (
            <div className="h-80 flex items-center justify-center">
                {/* FIX: Provided null for the action prop when not used. */}
                <EmptyState title="태그 데이터 없음" message="책에 태그를 추가하면 분포도를 볼 수 있습니다." action={null} />
            </div>
        );
    }
    return (
        <div className="h-80 w-full">
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};


// ============== App.tsx ==============
// FIX: React was used but not defined/imported. The import at the top of the file fixes this.
const { useState, useEffect, useCallback, useMemo } = React;

const App = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBookId, setSelectedBookId] = useState(null);
    const [stats, setStats] = useState(null);
    const [goalProgress, setGoalProgress] = useState(null);
    const [allBooks, setAllBooks] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [detailedStats, setDetailedStats] = useState(null);
    const [recommendation, setRecommendation] = useState(null);
    const [isRecommending, setIsRecommending] = useState(false);
    // FIX: Used `.getTime()` for proper date comparison.
    const recentBooks = useMemo(() => allBooks.filter(b => b.status === 'completed' && b.completionDate).sort((a,b) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime()).slice(0, 6), [allBooks]);
    const readingBooks = useMemo(() => allBooks.filter(b => b.status === 'reading'), [allBooks]);
    const libraryBooks = useMemo(() => allBooks.filter(b => b.status === 'completed' || b.status === 'reading'), [allBooks]);
    const wishlistBooks = useMemo(() => allBooks.filter(b => b.status === 'wishlist'), [allBooks]);
    const [toast, setToast] = useState(null);
    const [isAddBookModalOpen, setAddBookModalOpen] = useState(false);
    const [isReviewModalOpen, setReviewModalOpen] = useState(false);
    const [isQuoteModalOpen, setQuoteModalOpen] = useState(false);
    const [isGoalModalOpen, setGoalModalOpen] = useState(false);
    const [isUpdateProgressModalOpen, setUpdateProgressModalOpen] = useState(false);
    const [bookToUpdateProgress, setBookToUpdateProgress] = useState(null);
    const [bookForQuote, setBookForQuote] = useState(null);
    const [detailViewRefreshKey, setDetailViewRefreshKey] = useState(0);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleTabChange = (tabId) => {
        setSelectedBookId(null);
        setActiveTab(tabId);
    };

    const loadInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [statsData, goalData, booksData] = await Promise.all([
                apiService.getCompletedBooksStats(),
                apiService.getReadingGoalProgress(new Date().getFullYear(), new Date().getMonth() + 1),
                apiService.getBooks()
            ]);
            setStats(statsData);
            setGoalProgress(goalData);
            setAllBooks(booksData);
        } catch (error) {
            showToast('초기 데이터를 불러오지 못했습니다.', 'error');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshAllBooks = useCallback(async () => {
        setIsLoading(true);
        try {
            const books = await apiService.getBooks();
            setAllBooks(books);
        } catch (err) { showToast('책 목록을 새로고침하지 못했습니다.', 'error'); } 
        finally { setIsLoading(false); }
    }, []);
    
    const loadQuotes = useCallback(async () => {
        setIsLoading(true);
        try {
            const quotes = await apiService.getQuotes();
            setQuotes(quotes);
        } catch (err) { showToast('글귀 목록을 불러오지 못했습니다.', 'error'); }
        finally { setIsLoading(false); }
    }, []);

    const loadDetailedStats = useCallback(async () => {
        setIsLoading(true);
        try {
            const stats = await apiService.getDetailedStats();
            setDetailedStats(stats);
        } catch (err) { showToast('통계 정보를 불러오지 못했습니다.', 'error'); }
        finally { setIsLoading(false); }
    }, []);
    
    const handleDataUpdate = useCallback(async () => {
        setIsLoading(true);
        try {
             const [statsData, booksData, goalData] = await Promise.all([
                apiService.getCompletedBooksStats(),
                apiService.getBooks(),
                apiService.getReadingGoalProgress(new Date().getFullYear(), new Date().getMonth() + 1),
            ]);
            setStats(statsData);
            setAllBooks(booksData);
            setGoalProgress(goalData);
            if (activeTab === 'quotes') loadQuotes();
            if (activeTab === 'stats') loadDetailedStats();
        } catch (error) {
            showToast('데이터 업데이트에 실패했습니다.', 'error');
        }
        finally {
            setIsLoading(false);
        }
    }, [activeTab, loadQuotes, loadDetailedStats]);
    
    const handleGetRecommendation = useCallback(async () => {
        setIsRecommending(true);
        setRecommendation(null);
        try {
            const completedBooks = allBooks.filter(b => b.status === 'completed').map(b => b.title);
            if (completedBooks.length === 0) {
                showToast('추천을 받으려면 완독한 책이 한 권 이상 있어야 합니다.', 'error');
                return;
            }
            const rec = await getBookRecommendation(completedBooks);
            setRecommendation(rec);
        } catch (error) {
            showToast('AI 추천을 받아오는 데 실패했습니다.', 'error');
            console.error(error);
        } finally {
            setIsRecommending(false);
        }
    }, [allBooks]);

    const handleAddRecommendationToWishlist = useCallback(async () => {
        if (!recommendation) return;
        try {
            await apiService.addBook({
                title: recommendation.title,
                author: recommendation.author,
                status: 'wishlist',
            });
            showToast(`'${recommendation.title}'을(를) 읽고 싶은 책 목록에 추가했습니다.`, 'success');
            setRecommendation(null);
            handleDataUpdate();
        } catch (error) {
            showToast('책을 위시리스트에 추가하는 데 실패했습니다.', 'error');
            console.error(error);
        }
    }, [recommendation, handleDataUpdate]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    useEffect(() => {
        if (selectedBookId) return;
        switch (activeTab) {
            case 'dashboard': handleDataUpdate(); break;
            case 'library':
            case 'wishlist': refreshAllBooks(); break;
            case 'quotes': loadQuotes(); break;
            case 'stats': loadDetailedStats(); break;
        }
    }, [activeTab, selectedBookId]);

    const renderContent = () => {
        if (isLoading && !selectedBookId) return <LoadingSpinner />;
        switch (activeTab) {
            case 'dashboard': return <DashboardView stats={stats} goalProgress={goalProgress} recentBooks={recentBooks} readingBooks={readingBooks} recommendation={recommendation} isRecommending={isRecommending} onGetRecommendation={handleGetRecommendation} onAddRecommendationToWishlist={handleAddRecommendationToWishlist} onAddBook={() => setAddBookModalOpen(true)} onAddReview={() => setReviewModalOpen(true)} onAddQuote={() => { setBookForQuote(null); setQuoteModalOpen(true); }} onSetGoal={() => setGoalModalOpen(true)} onBookSelect={setSelectedBookId} onUpdateProgress={(book) => { setBookToUpdateProgress(book); setUpdateProgressModalOpen(true); }} />;
            case 'library': return <LibraryView books={libraryBooks} onBookSelect={setSelectedBookId} />;
            case 'wishlist': return <WishlistView books={wishlistBooks} onDataUpdate={handleDataUpdate} />;
            case 'quotes': return <QuotesView quotes={quotes} refreshQuotes={loadQuotes} showToast={showToast} />;
            case 'stats': return <StatsView stats={detailedStats} refreshStats={loadDetailedStats} />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <TabNavigation activeTab={activeTab} setActiveTab={handleTabChange} />
                <div className="mt-8">
                    {selectedBookId ? (
// FIX: Explicitly type BookDetailView as a React Functional Component to fix issues with `key` prop.
                        <BookDetailView key={detailViewRefreshKey} bookId={selectedBookId} onBack={() => setSelectedBookId(null)} onDataUpdate={handleDataUpdate} showToast={showToast} onAddQuote={(book) => { setBookForQuote(book); setQuoteModalOpen(true); }} />
                    ) : (
                        renderContent()
                    )}
                </div>
            </main>
            <AddBookModal isOpen={isAddBookModalOpen} onClose={() => setAddBookModalOpen(false)} onBookAdded={() => { handleDataUpdate(); showToast('책이 성공적으로 추가되었습니다!', 'success'); }} showToast={showToast} />
            <AddReviewModal isOpen={isReviewModalOpen} onClose={() => setReviewModalOpen(false)} onReviewAdded={() => { if(activeTab === 'stats') loadDetailedStats(); showToast('서평이 성공적으로 추가되었습니다!', 'success'); }} />
            <AddQuoteModal
                isOpen={isQuoteModalOpen}
                onClose={() => {
                    setQuoteModalOpen(false);
                    setBookForQuote(null);
                }}
                onQuoteAdded={() => {
                    if (activeTab === 'quotes') loadQuotes();
                    if (selectedBookId) {
                        setDetailViewRefreshKey(k => k + 1);
                    }
                    showToast('글귀가 성공적으로 추가되었습니다!', 'success');
                }}
                defaultBook={bookForQuote}
            />
            <SetGoalModal isOpen={isGoalModalOpen} onClose={() => setGoalModalOpen(false)} onGoalSet={() => { handleDataUpdate(); showToast('목표가 성공적으로 설정되었습니다!', 'success'); }} />
            <UpdateProgressModal isOpen={isUpdateProgressModalOpen} onClose={() => setUpdateProgressModalOpen(false)} book={bookToUpdateProgress} onProgressUpdated={() => { handleDataUpdate(); showToast('진행률이 업데이트되었습니다!', 'success'); }} />
            {toast && (<div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white animate-slide-in-up ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{toast.message}</div>)}
        </div>
    );
};

const Header = () => (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">나의 독서 기록</h1>
            <p className="mt-4 text-lg md:text-xl text-indigo-200 max-w-2xl mx-auto">나만의 서재를 손쉽게 관리하세요.</p>
        </div>
    </header>
);

const TabNavigation = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'dashboard', name: '대시보드' }, { id: 'library', name: '내 서재' }, { id: 'wishlist', name: '읽고 싶은 책' },
        { id: 'quotes', name: '글귀 모음' }, { id: 'stats', name: '통계' },
    ];
    return (
        <div className="bg-white rounded-xl shadow-sm p-2 -mt-12 sticky top-4 z-40">
            <nav className="flex space-x-2 overflow-x-auto">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`${activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'} flex-1 px-3 py-2.5 font-semibold text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap min-w-max`}>
                        {tab.name}
                    </button>
                ))}
            </nav>
        </div>
    );
};

const DashboardView = ({ stats, goalProgress, recentBooks, readingBooks, recommendation, isRecommending, onGetRecommendation, onAddRecommendationToWishlist, onAddBook, onAddReview, onAddQuote, onSetGoal, onBookSelect, onUpdateProgress }) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
        <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="총 완독" value={stats?.completedBooks} />
                <StatCard label="올해 완독" value={stats?.thisYearBooks} />
                <StatCard label="이달 완독" value={stats?.thisMonthBooks} />
                <StatCard label="총 페이지" value={stats?.totalPages?.toLocaleString()} />
            </div>
            <Card>
                <h2 className="text-xl font-bold mb-4">읽고 있는 책</h2>
                {readingBooks.length > 0 ? (
// FIX: Explicitly type CurrentlyReadingItem as a React Functional Component to fix issues with `key` prop.
                    <div className="space-y-4">{readingBooks.map(book => (<CurrentlyReadingItem key={book.id} book={book} onUpdateProgress={() => onUpdateProgress(book)} onSelect={() => onBookSelect(book.id)} />))}</div>
                ) : ( <EmptyState title="읽고 있는 책이 없습니다" message="새로운 책을 읽기 시작해보세요." action={<Button onClick={onAddBook}>+ 책 추가하기</Button>} /> )}
            </Card>
            <Card>
                <h2 className="text-xl font-bold mb-4">최근 완독한 책</h2>
                {recentBooks.length > 0 ? (
// FIX: Explicitly type BookItem as a React Functional Component to fix issues with `key` prop.
                    <div className="space-y-4">{recentBooks.map(book => <BookItem key={book.id} book={book} onSelect={() => onBookSelect(book.id)} />)}</div>
                ) : ( <EmptyState title="아직 책이 없습니다" message="첫 완독 도서를 추가하여 시작하세요." action={<Button onClick={onAddBook}>첫 책 추가하기</Button>} /> )}
            </Card>
        </div>
        <div className="space-y-8">
            <Card>
                <h2 className="text-xl font-bold mb-4">작업</h2>
                <div className="flex flex-col space-y-3">
                    <Button onClick={onAddBook}>+ 새 책 추가</Button>
                    <Button onClick={onAddReview} variant="success">✏️ 서평 작성</Button>
                    <Button onClick={onAddQuote} variant="secondary">❝ 글귀 추가</Button>
                </div>
            </Card>
            <Card>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><SparklesIcon/> AI 책 추천</h2>
                 {isRecommending ? (
                    <div className="text-center py-4"> <LoadingSpinner /> <p className="text-sm text-slate-500 mt-2">당신을 위한 책을 찾고 있어요...</p> </div>
                 ) : recommendation ? (
                    <div>
                        <p className="text-sm text-slate-500">이런 책은 어떠세요?</p>
                        <p className="font-bold text-lg mt-1">{recommendation.title}</p>
                        <p className="text-sm text-slate-600 mb-4">{recommendation.author}</p>
                        <div className="flex gap-2">
                             <Button onClick={onAddRecommendationToWishlist} variant="success" className="flex-1">+ 읽고 싶은 책에 추가</Button>
                             <Button onClick={onGetRecommendation} variant="secondary" className="!p-2.5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.69v-4.992m0 0h-4.992m4.992 0l-3.181-3.183a8.25 8.25 0 00-11.667 0L2.985 9.348z" /></svg></Button>
                        </div>
                    </div>
                 ) : ( <Button onClick={onGetRecommendation} variant="secondary" className="w-full gap-2">새로운 책 추천받기</Button> )}
            </Card>
            <Card>
                <h2 className="text-xl font-bold mb-4">이달의 목표</h2>
                {goalProgress && goalProgress.target > 0 ? (
                    <div>
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="font-semibold">{goalProgress.achieved} / {goalProgress.target} 권</span>
                            <span className="text-2xl font-bold text-blue-600">{goalProgress.progress}%</span>
                        </div>
                        <ProgressBar progress={goalProgress.progress} />
                         <Button onClick={onSetGoal} variant="secondary" className="w-full mt-4 !text-xs !py-1.5">목표 수정</Button>
                    </div>
                ) : ( <EmptyState title="설정된 목표 없음" message="이달의 목표를 설정하고 진행 상황을 추적하세요." action={<Button onClick={onSetGoal}>목표 설정</Button>} /> )}
            </Card>
        </div>
    </div>
);
const LibraryView = ({ books, onBookSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState(null);
    const allTags = useMemo(() => {
        const tagSet = new Set();
        books.forEach(book => book.tags?.forEach(tag => tagSet.add(tag)));
        return Array.from(tagSet).sort();
    }, [books]);
    const filteredBooks = useMemo(() => {
        let tempBooks = books;
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            tempBooks = tempBooks.filter(b => b.title.toLowerCase().includes(lowerCaseSearchTerm) || b.author.toLowerCase().includes(lowerCaseSearchTerm));
        }
        if (selectedTag) {
            tempBooks = tempBooks.filter(b => b.tags?.includes(selectedTag));
        }
        return tempBooks;
    }, [books, searchTerm, selectedTag]);
    return (
        <Card className="animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold">내 서재 ({books.length})</h2>
                <div className="flex items-center gap-2 w-full md:w-auto md:min-w-[300px]">
                    <SearchInput placeholder="책 제목 또는 저자로 검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>
            {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
                    <button onClick={() => setSelectedTag(null)} className={`text-sm font-medium px-3 py-1.5 rounded-lg transition ${!selectedTag ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>전체</button>
                    {allTags.map(tag => ( <button key={tag} onClick={() => setSelectedTag(tag)} className={`text-sm font-medium px-3 py-1.5 rounded-lg transition ${selectedTag === tag ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>#{tag}</button> ))}
                </div>
            )}
            {filteredBooks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredBooks.map(book => (
                        <Card key={book.id} className="flex flex-col justify-between" onClick={() => onBookSelect(book.id)}>
                            <div>
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-md text-slate-800 pr-2">{book.title}</h3>
                                    {book.status === 'reading' && (<span className="flex-shrink-0 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">읽는 중</span>)}
                                    {book.status === 'completed' && (<span className="flex-shrink-0 bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">완독</span>)}
                                </div>
                                <p className="text-slate-500 text-sm mb-4">{book.author}</p>
                            </div>
                            {book.tags && book.tags.length > 0 && (<div className="flex flex-wrap gap-1.5">{book.tags.slice(0, 3).map(tag => <TagBadge key={tag} tag={tag} />)}</div>)}
                        </Card>
                    ))}
                </div>
            // FIX: Provided null for the action prop when not used.
            ) : ( <EmptyState title="책을 찾을 수 없습니다" message={searchTerm || selectedTag ? "다른 검색어나 필터를 시도해보세요." : "읽은 책을 목록에 추가하세요!"} action={null}/> )}
        </Card>
    );
};
const WishlistView = ({ books, onDataUpdate }) => {
    const handleStartReading = async (bookId) => {
        try {
            await apiService.updateBook(bookId, { status: 'reading', startedDate: new Date().toISOString().split('T')[0] });
            onDataUpdate();
        } catch (error) {
            console.error("Failed to update book status to reading:", error);
            alert('독서 시작 처리 중 오류가 발생했습니다.');
        }
    };
    return (
        <Card className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6">읽고 싶은 책 ({books.length})</h2>
            {books.length > 0 ? (
                <div className="space-y-4">
                    {books.map(book => (
                        <div key={book.id} className="flex items-center space-x-4 p-3 hover:bg-slate-100 rounded-lg">
                            <div className="flex-shrink-0 text-slate-400"><BookmarkIcon className="w-6 h-6" /></div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 truncate">{book.title}</p>
                                <p className="text-sm text-slate-500 truncate">{book.author}</p>
                            </div>
                            <Button onClick={() => handleStartReading(book.id)}>독서 시작</Button>
                        </div>
                    ))}
                </div>
            // FIX: Provided null for the action prop when not used.
            ) : ( <EmptyState title="읽고 싶은 책이 없습니다" message="관심 있는 책을 추가하여 위시리스트를 만들어보세요." action={null}/> )}
        </Card>
    );
}
const QuotesView = ({ quotes, refreshQuotes, showToast }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredQuotes = useMemo(() => {
        const sorted = [...quotes].sort((a, b) => {
            if (a.pageNumber == null && b.pageNumber == null) return 0;
            if (a.pageNumber == null) return 1;
            if (b.pageNumber == null) return -1;
            return a.pageNumber - b.pageNumber;
        });

        if (!searchTerm) return sorted;
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return sorted.filter(q =>
            q.quoteText.toLowerCase().includes(lowerCaseSearchTerm) ||
            (q.bookTitle && q.bookTitle.toLowerCase().includes(lowerCaseSearchTerm)) ||
            (q.bookAuthor && q.bookAuthor.toLowerCase().includes(lowerCaseSearchTerm))
        );
    }, [quotes, searchTerm]);
    const handleDelete = async (id) => {
        if (window.confirm('이 글귀를 정말 삭제하시겠습니까?')) {
            try {
                await apiService.deleteQuote(id);
                showToast('글귀가 삭제되었습니다.');
                refreshQuotes();
            } catch (error) {
                console.error("Failed to delete quote", error);
                showToast('글귀 삭제에 실패했습니다.', 'error');
            }
        }
    };
    return (
        <Card className="animate-fade-in">
             <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold">글귀 모음 ({quotes.length})</h2>
                <div className="flex items-center gap-2 w-full md:w-auto md:min-w-[300px]">
                    <SearchInput placeholder="글귀 내용, 책 제목으로 검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>
             {filteredQuotes.length > 0 ? (
                <div className="space-y-6">
                    {filteredQuotes.map(quote => (
                        <div key={quote.id} className="p-5 border-l-4 border-blue-500 bg-slate-100 rounded-r-lg group">
                            <blockquote className="text-lg italic text-slate-700">"{quote.quoteText}"</blockquote>
                            <footer className="mt-4 text-sm text-slate-500 flex justify-between items-center">
                                <div><span className="font-semibold">{quote.bookTitle}</span> (저자: {quote.bookAuthor}){quote.pageNumber && `, p. ${quote.pageNumber}`}</div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button onClick={() => handleDelete(quote.id)} variant="danger" className="!p-2"><TrashIcon className="w-4 h-4"/></Button>
                                </div>
                            </footer>
                        </div>
                    ))}
                </div>
            // FIX: Provided null for the action prop when not used.
            ) : ( <EmptyState title="저장된 글귀 없음" message={searchTerm ? "검색 결과가 없습니다." : "읽은 책에서 인상 깊은 글귀를 추가하세요."} action={null}/> )}
        </Card>
    );
};
const StatsView = ({ stats, refreshStats }) => (
    <div className="space-y-8 animate-fade-in">
         <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">독서 통계</h2>
            <Button onClick={refreshStats} variant="secondary">통계 새로고침</Button>
        </div>
        <Card>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ChartBarIcon/> 월별 완독 현황</h3>
            <MonthlyProgressChart data={stats?.monthlyData || []} />
        </Card>
        <Card>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.116 3.552.97 5.37c.245 1.15-.999 2.06-2.028 1.567L12 18.202l-4.789 2.685c-1.03.5-2.273-.417-2.028-1.567l.97-5.37-4.116-3.552c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg> 평점 분포</h3>
            <RatingDistributionChart data={stats?.ratingData || []} />
        </Card>
        <Card>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><TagIcon/> 태그별 독서 분포</h3>
            <TagDistributionChart data={stats?.tagData || []} />
        </Card>
    </div>
);
const StatCard = ({ label, value = 0 }) => (
    <Card className="text-center">
        <div className="text-3xl font-extrabold text-blue-600">{value}</div>
        <div className="text-sm text-slate-500 mt-1">{label}</div>
    </Card>
);
// FIX: Explicitly type BookItem as a React Functional Component to fix issues with `key` prop.
const BookItem: React.FC<{ book: any, onSelect: any }> = ({ book, onSelect }) => (
    <div className="flex items-center space-x-4 p-3 hover:bg-slate-100 rounded-lg cursor-pointer" onClick={onSelect}>
        <div className="flex-shrink-0 text-slate-400">
            <BookOpenIcon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 truncate">{book.title}</p>
            <p className="text-sm text-slate-500 truncate">{book.author}</p>
        </div>
        <p className="text-sm text-slate-400 whitespace-nowrap">{formatDate(book.completionDate)}</p>
    </div>
);
// FIX: Explicitly type CurrentlyReadingItem as a React Functional Component to fix issues with `key` prop.
const CurrentlyReadingItem: React.FC<{ book: any, onUpdateProgress: any, onSelect: any }> = ({ book, onUpdateProgress, onSelect }) => {
    const progress = book.pages && book.currentPage ? Math.round((book.currentPage / book.pages) * 100) : 0;
    return (
        <div className="flex items-center space-x-4 p-3 hover:bg-slate-100 rounded-lg">
            <div className="flex-shrink-0 text-slate-400 cursor-pointer" onClick={onSelect}>
                <BookOpenIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={onSelect}>
                <p className="font-semibold text-slate-800 truncate">{book.title}</p>
                <ProgressBar progress={progress} className="my-1.5" />
                <div className="text-xs text-slate-500 flex justify-between"><span>{progress}%</span><span>{book.currentPage} / {book.pages} 페이지</span></div>
            </div>
            <Button onClick={onUpdateProgress} variant="secondary" className="!p-2.5 flex-shrink-0"><PlusCircleIcon className="w-5 h-5" /></Button>
        </div>
    );
};

// FIX: Explicitly type BookDetailView as a React Functional Component to fix issues with `key` prop.
const BookDetailView: React.FC<{ bookId: any, onBack: any, onDataUpdate: any, showToast: any, onAddQuote: any }> = ({ bookId, onBack, onDataUpdate, showToast, onAddQuote }) => {
    const [book, setBook] = useState(null);
    const [quotes, setQuotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditBookModalOpen, setEditBookModalOpen] = useState(false);
    const [isEditQuoteModalOpen, setEditQuoteModalOpen] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);

    const sortedQuotes = useMemo(() => {
        return [...quotes].sort((a, b) => {
            if (a.pageNumber == null && b.pageNumber == null) return 0;
            if (a.pageNumber == null) return 1;
            if (b.pageNumber == null) return -1;
            return a.pageNumber - b.pageNumber;
        });
    }, [quotes]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [bookData, quotesData] = await Promise.all([ apiService.getBookById(bookId), apiService.getQuotesByBookId(bookId), ]);
            setBook(bookData || null);
            setQuotes(quotesData);
        } catch (error) { console.error("Failed to fetch book details", error); } 
        finally { setIsLoading(false); }
    }, [bookId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleEditQuoteClick = (quote) => {
        setSelectedQuote(quote);
        setEditQuoteModalOpen(true);
    };
    const handleDeleteBook = async () => {
        if (window.confirm('이 책과 관련된 모든 데이터(글귀, 서평)가 삭제됩니다. 정말 삭제하시겠습니까?')) {
            setIsLoading(true);
            try {
                await apiService.deleteBook(bookId);
                showToast('책이 성공적으로 삭제되었습니다.');
                onBack();
            } catch (error) {
                console.error("Failed to delete book", error);
                showToast('책 삭제에 실패했습니다.', 'error');
                setIsLoading(false);
            }
        }
    };
    const handleDeleteQuote = async (quoteId) => {
        if (window.confirm('이 글귀를 정말 삭제하시겠습니까?')) {
            try {
                await apiService.deleteQuote(quoteId);
                showToast('글귀가 삭제되었습니다.');
                fetchData();
            } catch (error) {
                showToast('글귀 삭제에 실패했습니다.', 'error');
                console.error("Failed to delete quote", error);
            }
        }
    }
    const handleStatusChange = async (newStatus) => {
        if (!book) return;
        let updates: { [key: string]: any } = { status: newStatus };
        if (newStatus === 'reading') { updates['startedDate'] = new Date().toISOString().split('T')[0]; } 
        else if (newStatus === 'completed') { updates['completionDate'] = new Date().toISOString().split('T')[0]; }
        try {
            await apiService.updateBook(book.id, updates);
            showToast('책 상태가 성공적으로 업데이트되었습니다.');
            fetchData();
            onDataUpdate();
        } catch (error) {
            console.error("Failed to update book status:", error);
            showToast('책 상태 업데이트에 실패했습니다.', 'error');
        }
    }
    
    if (isLoading) return <LoadingSpinner />;
    if (!book) return <EmptyState title="책을 찾을 수 없습니다" message="목록으로 돌아가 다시 시도해주세요." action={<Button onClick={onBack}>목록으로 돌아가기</Button>} />;
    
    const progress = book.pages && book.currentPage ? Math.round((book.currentPage / book.pages) * 100) : 0;

    return (
        <div className="animate-fade-in">
            <Button onClick={onBack} variant="secondary" className="mb-6">← 목록으로 돌아가기</Button>
            <div className="space-y-8">
                <Card>
                    <div className="flex justify-between items-start">
                         <div>
                            <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-slate-800">{book.title}</h1>
                            {book.status === 'reading' && <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">읽는 중</span>}
                            {book.status === 'completed' && <span className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">완독</span>}
                            {book.status === 'wishlist' && <span className="bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">읽고 싶은 책</span>}
                            </div>
                            <p className="text-lg text-slate-500 mt-1">{book.author}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={() => setEditBookModalOpen(true)} variant="secondary" className="!p-2.5"><PencilIcon className="w-5 h-5"/></Button>
                            <Button onClick={handleDeleteBook} variant="danger" className="!p-2.5"><TrashIcon className="w-5 h-5"/></Button>
                        </div>
                    </div>
                    <div className="mt-6 border-t pt-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div><p className="text-slate-500">출판사</p><p className="font-semibold">{book.publisher || '-'}</p></div>
                        <div><p className="text-slate-500">{book.status === 'completed' ? '완독일' : '시작일'}</p><p className="font-semibold">{formatDate(book.completionDate || book.startedDate) || '-'}</p></div>
                        <div><p className="text-slate-500">페이지</p><p className="font-semibold">{book.pages ? `${book.pages}쪽` : '-'}</p></div>
                    </div>
                    {book.tags && book.tags.length > 0 && (<div className="mt-4 flex flex-wrap gap-2">{book.tags.map(tag => <TagBadge key={tag} tag={tag} />)}</div>)}
                     {book.status === 'reading' && (
                        <div className="mt-6 border-t pt-6">
                            <h3 className="text-sm font-medium text-slate-700 mb-2">독서 진행률</h3>
                            <ProgressBar progress={progress} className="mb-1" />
                            <div className="text-xs text-slate-500 flex justify-between"><span>{progress}%</span><span>{book.currentPage} / {book.pages} 페이지</span></div>
                        </div>
                    )}
                    <div className="mt-6 border-t pt-6 flex gap-2">
                        {book.status === 'wishlist' && <Button onClick={() => handleStatusChange('reading')}>독서 시작</Button>}
                        {book.status === 'reading' && <Button onClick={() => handleStatusChange('completed')} variant="success">완독으로 표시</Button>}
                    </div>
                </Card>
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">저장된 글귀</h2>
                        <Button onClick={() => onAddQuote(book)} variant="secondary" className="!py-1.5 !px-3 !text-sm flex items-center gap-1">
                            <PlusCircleIcon className="w-4 h-4" />
                            글귀 추가
                        </Button>
                    </div>
                    {sortedQuotes.length > 0 ? (
                        <div className="space-y-4">
                            {sortedQuotes.map(quote => (
                                <div key={quote.id} className="p-4 bg-slate-50 rounded-lg group">
                                    <blockquote className="italic text-slate-600">"{quote.quoteText}"</blockquote>
                                    <div className="mt-3 flex justify-between items-center">
                                        <p className="text-sm font-semibold text-blue-600">{quote.pageNumber ? `p. ${quote.pageNumber}` : '페이지 정보 없음'}</p>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button onClick={() => handleEditQuoteClick(quote)} variant="secondary" className="!p-2 !text-xs"><PencilIcon className="w-4 h-4" /></Button>
                                            <Button onClick={() => handleDeleteQuote(quote.id)} variant="danger" className="!p-2 !text-xs"><TrashIcon className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    // FIX: Provided null for the action prop when not used.
                    ) : ( <EmptyState title="저장된 글귀 없음" message="이 책에서 인상 깊은 글귀를 추가해보세요." action={null}/> )}
                </Card>
            </div>
            <EditBookModal isOpen={isEditBookModalOpen} onClose={() => setEditBookModalOpen(false)} book={book} onBookUpdated={(updatedData) => { setBook(prevBook => ({ ...prevBook, ...updatedData })); onDataUpdate(); }} showToast={showToast} />
            <EditQuoteModal isOpen={isEditQuoteModalOpen} onClose={() => setEditQuoteModalOpen(false)} quote={selectedQuote} onQuoteUpdated={fetchData} />
        </div>
    );
};

const AddBookModal = ({ isOpen, onClose, onBookAdded, showToast }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState('completed');

    useEffect(() => {
        if(isOpen) {
          setStatus('completed');
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        
        const completionDate = data.completionDate ? `${data.completionDate}T12:00:00.000Z` : undefined;
        const startedDate = data.startedDate ? `${data.startedDate}T12:00:00.000Z` : undefined;
        
        const tags = String(data.tags || '').split(',').map(t => t.trim()).filter(Boolean);
        try {
            await apiService.addBook({
                title: data.title, author: data.author, status: data.status,
                publisher: data.publisher || undefined, completionDate: completionDate,
                startedDate: startedDate, pages: Number(data.pages) || undefined,
                currentPage: Number(data.currentPage) || undefined, tags: tags.length > 0 ? tags : undefined,
            });
            onBookAdded(); onClose();
        } catch (err) { 
            console.error(err); 
            showToast('책 추가에 실패했습니다.', 'error');
        } 
        finally { setIsSubmitting(false); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="+ 새 책 추가">
            <form onSubmit={handleSubmit}>
                <Input label="제목" id="title" name="title" type="text" required />
                <Input label="저자" id="author" name="author" type="text" required />
                 <Select label="독서 상태" id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value)} required>
                    <option value="completed">완독</option><option value="reading">읽는 중</option><option value="wishlist">읽고 싶은 책</option>
                </Select>
                {status === 'completed' && <Input label="완독일" id="completionDate" name="completionDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />}
                {status === 'reading' && <Input label="시작일" id="startedDate" name="startedDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />}
                {(status === 'completed' || status === 'reading') && <Input label="총 페이지 수" id="pages" name="pages" type="number" />}
                {status === 'reading' && <Input label="현재 읽은 페이지" id="currentPage" name="currentPage" type="number" />}
                <Input label="출판사" id="publisher" name="publisher" type="text" />
                <Input label="태그 (쉼표로 구분)" id="tags" name="tags" type="text" placeholder="예: 소설, 프로그래밍, 자기계발" />
                <Button type="submit" className="w-full mt-4" isLoading={isSubmitting}>책 추가</Button>
            </form>
        </Modal>
    );
};
const EditBookModal = ({ isOpen, onClose, onBookUpdated, book, showToast }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!book) return;
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        
        const tags = String(formData.get('tags') || '').split(',').map(t => t.trim()).filter(Boolean);

        const data: { [key: string]: any } = {
            title: formData.get('title'),
            author: formData.get('author'),
            publisher: formData.get('publisher') || undefined,
            tags: tags.length > 0 ? tags : [],
        };

        if (book.status === 'completed' || book.status === 'reading') {
            data.pages = Number(formData.get('pages')) || undefined;
        }
        
        if (book.status === 'completed') {
            const completionDate = formData.get('completionDate');
            data.completionDate = completionDate ? `${completionDate}T12:00:00.000Z` : undefined;
        }
        
        if (book.status === 'reading') {
            const startedDate = formData.get('startedDate');
            data.startedDate = startedDate ? `${startedDate}T12:00:00.000Z` : undefined;
            data.currentPage = Number(formData.get('currentPage')) || undefined;
        }

        try {
            await apiService.updateBook(book.id, data);
            onBookUpdated(data); 
            onClose();
            showToast('책 정보가 성공적으로 수정되었습니다.');
        } catch (err) { 
            console.error(err); 
            showToast('책 정보 수정에 실패했습니다.', 'error');
        } 
        finally { setIsSubmitting(false); }
    };

    if (!book) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="책 정보 수정">
            <form onSubmit={handleSubmit}>
                <Input label="제목" id="title" name="title" type="text" defaultValue={book.title} required />
                <Input label="저자" id="author" name="author" type="text" defaultValue={book.author} required />
                {book.status === 'completed' && <Input label="완독일" id="completionDate" name="completionDate" type="date" defaultValue={formatDate(book.completionDate)} required />}
                {book.status === 'reading' && <Input label="시작일" id="startedDate" name="startedDate" type="date" defaultValue={formatDate(book.startedDate)} required />}
                {(book.status === 'completed' || book.status === 'reading') && <Input label="총 페이지 수" id="pages" name="pages" type="number" defaultValue={book.pages} />}
                {book.status === 'reading' && <Input label="현재 읽은 페이지" id="currentPage" name="currentPage" type="number" defaultValue={book.currentPage} />}
                <Input label="출판사" id="publisher" name="publisher" type="text" defaultValue={book.publisher} />
                <Input label="태그 (쉼표로 구분)" id="tags" name="tags" type="text" defaultValue={book.tags?.join(', ')} placeholder="예: 소설, 프로그래밍" />
                <Button type="submit" className="w-full mt-4" isLoading={isSubmitting}>수정 완료</Button>
            </form>
        </Modal>
    );
};
const AddReviewModal = ({ isOpen, onClose, onReviewAdded }) => {
    const [books, setBooks] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // FIX: React was used but not defined/imported. The import at the top of the file fixes this.
    const formRef = React.useRef(null);
    
    useEffect(() => {
        if (isOpen) {
            apiService.getBooks(['completed'])
                .then(setBooks)
                .catch(err => console.error("Failed to load completed books for review modal:", err));
        }
    }, [isOpen]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        try {
             await apiService.addBookReview({ bookId: data.bookId, rating: Number(data.rating), shortReview: data.shortReview, detailedReview: data.detailedReview || undefined });
            onReviewAdded(); onClose();
        } catch (err) { console.error(err); } 
        finally { setIsSubmitting(false); }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="✏️ 서평 작성">
             <form onSubmit={handleSubmit} ref={formRef}>
                <Select label="책" id="bookId" name="bookId" required><option value="">책을 선택하세요...</option>{books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}</Select>
                <Select label="평점" id="rating" name="rating" required><option value="">평점을 선택하세요...</option>{[5,4,3,2,1].map(r => <option key={r} value={r}>{'★'.repeat(r)}{'☆'.repeat(5-r)} ({r}점)</option>)}</Select>
                <Input label="한줄평" id="shortReview" name="shortReview" required />
                <Textarea label="상세 서평" id="detailedReview" name="detailedReview" />
                <Button type="submit" variant="success" className="w-full mt-4" isLoading={isSubmitting}>서평 제출</Button>
            </form>
        </Modal>
    );
};
const AddQuoteModal = ({ isOpen, onClose, onQuoteAdded, defaultBook }) => {
    const [books, setBooks] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => {
        if (isOpen && !defaultBook) {
            apiService.getBooks(['completed', 'reading'])
                .then(setBooks)
                .catch(err => console.error("Failed to load books for quote modal:", err));
        }
    }, [isOpen, defaultBook]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        const bookId = defaultBook ? defaultBook.id : data.bookId;
        try {
            await apiService.addQuote({ bookId: bookId, quoteText: data.quoteText, pageNumber: Number(data.pageNumber) || undefined });
            onQuoteAdded();
            onClose();
        } catch (err) { console.error(err); }
        finally { setIsSubmitting(false); }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="❝ 글귀 추가">
            <form onSubmit={handleSubmit}>
                {defaultBook ? (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">책</label>
                        <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-600 truncate">
                            {defaultBook.title}
                        </div>
                    </div>
                ) : (
                    <Select label="책" id="bookId" name="bookId" required>
                        <option value="">책을 선택하세요...</option>
                        {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                    </Select>
                )}
                <Textarea label="글귀" id="quoteText" name="quoteText" required />
                <Input label="페이지 번호 (선택)" id="pageNumber" name="pageNumber" type="number" />
                <Button type="submit" variant="secondary" className="w-full mt-4" isLoading={isSubmitting}>글귀 추가</Button>
            </form>
        </Modal>
    );
};
const EditQuoteModal = ({ isOpen, onClose, onQuoteUpdated, quote }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!quote) return;
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const data = { quoteText: formData.get('quoteText'), pageNumber: Number(formData.get('pageNumber')) || undefined };
        try {
            await apiService.updateQuote(quote.id, data);
            onQuoteUpdated(); onClose();
        } catch (err) { console.error(err); }
        finally { setIsSubmitting(false); }
    };
    if (!quote) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="글귀 수정">
            <form onSubmit={handleSubmit}>
                <div className="mb-4 p-3 bg-slate-100 rounded-lg"><p className="text-sm font-medium text-slate-700">책</p><p className="text-slate-500">{quote.bookTitle}</p></div>
                <Textarea label="글귀" id="quoteText" name="quoteText" defaultValue={quote.quoteText} required />
                <Input label="페이지 번호 (선택)" id="pageNumber" name="pageNumber" type="number" defaultValue={quote.pageNumber} />
                <Button type="submit" variant="secondary" className="w-full mt-4" isLoading={isSubmitting}>수정 완료</Button>
            </form>
        </Modal>
    );
};
const SetGoalModal = ({ isOpen, onClose, onGoalSet }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        try {
            await apiService.setReadingGoal(Number(data.year), Number(data.month), Number(data.target));
            onGoalSet(); onClose();
        } catch (err) { console.error(err); }
        finally { setIsSubmitting(false); }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="🎯 독서 목표 설정">
             <form onSubmit={handleSubmit}>
                <Input label="연도" id="year" name="year" type="number" defaultValue={currentYear} required />
                <Select label="월" id="month" name="month" defaultValue={currentMonth} required>{Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('ko-KR', { month: 'long' })}</option>)}</Select>
                <Input label="목표 권수" id="target" name="target" type="number" required />
                <Button type="submit" className="w-full mt-4" isLoading={isSubmitting}>목표 설정</Button>
            </form>
        </Modal>
    );
};
const UpdateProgressModal = ({isOpen, onClose, book, onProgressUpdated}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!book) return;
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const currentPage = Number(formData.get('currentPage'));
        try {
            await apiService.updateBook(book.id, { currentPage });
            onProgressUpdated(); onClose();
        } catch(err) { console.error(err) }
        finally { setIsSubmitting(false) }
    };
    if (!book) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="진행률 업데이트">
            <form onSubmit={handleSubmit}>
                <p className="font-semibold text-lg mb-4">{book.title}</p>
                <Input label={`현재 페이지 (총 ${book.pages || '?'} 페이지)`} id="currentPage" name="currentPage" type="number" defaultValue={book.currentPage || 0} max={book.pages} required />
                <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>업데이트</Button>
            </form>
        </Modal>
    );
};

// ============== index.tsx ==============
const rootElement = document.getElementById('root');
// FIX: ReactDOM was used but not defined/imported. The import at the top of the file fixes this.
const root = ReactDOM.createRoot(rootElement);
root.render(
  // FIX: React was used but not defined/imported. The import at the top of the file fixes this.
  <React.StrictMode>
    <App />
  </React.StrictMode>
);