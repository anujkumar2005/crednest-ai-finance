-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT,
    email TEXT,
    age INTEGER,
    gender TEXT,
    date_of_birth DATE,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    pincode TEXT,
    occupation TEXT,
    company TEXT,
    monthly_income NUMERIC,
    profile_image TEXT,
    bio TEXT,
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_sessions table
CREATE TABLE public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT DEFAULT 'New Chat',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    tool_used TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create budgets table
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    month TEXT NOT NULL,
    category TEXT NOT NULL,
    planned_amount NUMERIC NOT NULL DEFAULT 0,
    spent_amount NUMERIC DEFAULT 0,
    icon TEXT,
    color TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT,
    location TEXT,
    tags TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create incomes table
CREATE TABLE public.incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    source TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create savings_goals table
CREATE TABLE public.savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    target_amount NUMERIC NOT NULL,
    current_amount NUMERIC DEFAULT 0,
    deadline DATE,
    icon TEXT,
    color TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create banks table (public data)
CREATE TABLE public.banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    home_loan_rate NUMERIC,
    personal_loan_rate NUMERIC,
    car_loan_rate NUMERIC,
    education_loan_rate NUMERIC,
    business_loan_rate NUMERIC,
    savings_rate NUMERIC,
    fd_rate_1yr NUMERIC,
    fd_rate_3yr NUMERIC,
    fd_rate_5yr NUMERIC,
    processing_fee NUMERIC,
    min_cibil_score INTEGER,
    max_loan_amount NUMERIC,
    min_loan_amount NUMERIC,
    max_tenure_years INTEGER,
    min_balance NUMERIC,
    features JSONB,
    description TEXT,
    website TEXT,
    apply_url TEXT,
    customer_care TEXT,
    rating NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create insurance_companies table (public data)
CREATE TABLE public.insurance_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    claim_settlement_ratio NUMERIC,
    life_premium_min NUMERIC,
    life_premium_max NUMERIC,
    health_premium_min NUMERIC,
    health_premium_max NUMERIC,
    vehicle_premium_min NUMERIC,
    vehicle_premium_max NUMERIC,
    home_premium_min NUMERIC,
    home_premium_max NUMERIC,
    coverage_amount_min NUMERIC,
    coverage_amount_max NUMERIC,
    features JSONB,
    description TEXT,
    website TEXT,
    apply_url TEXT,
    customer_care TEXT,
    rating NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create investment_funds table (public data)
CREATE TABLE public.investment_funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    fund_type TEXT NOT NULL,
    amc TEXT,
    logo_url TEXT,
    nav NUMERIC,
    returns_1yr NUMERIC,
    returns_3yr NUMERIC,
    returns_5yr NUMERIC,
    expense_ratio NUMERIC,
    min_investment NUMERIC,
    min_sip NUMERIC,
    risk_level TEXT,
    rating NUMERIC,
    aum NUMERIC,
    features JSONB,
    description TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_loans table
CREATE TABLE public.user_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    bank_id UUID REFERENCES public.banks(id),
    loan_type TEXT NOT NULL,
    principal_amount NUMERIC NOT NULL,
    interest_rate NUMERIC NOT NULL,
    tenure_months INTEGER NOT NULL,
    emi_amount NUMERIC,
    start_date DATE,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create financial_corpus table for RAG
CREATE TABLE public.financial_corpus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    subcategory TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    keywords TEXT[],
    source TEXT,
    bank_name TEXT,
    loan_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all user tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_corpus ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for chat_sessions
CREATE POLICY "Users can view own sessions" ON public.chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sessions" ON public.chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.chat_sessions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for budgets
CREATE POLICY "Users can view own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for expenses
CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for incomes
CREATE POLICY "Users can view own incomes" ON public.incomes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own incomes" ON public.incomes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own incomes" ON public.incomes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own incomes" ON public.incomes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for savings_goals
CREATE POLICY "Users can view own goals" ON public.savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own goals" ON public.savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.savings_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.savings_goals FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_loans
CREATE POLICY "Users can view own loans" ON public.user_loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own loans" ON public.user_loans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own loans" ON public.user_loans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own loans" ON public.user_loans FOR DELETE USING (auth.uid() = user_id);

-- Public read access for reference tables
CREATE POLICY "Anyone can view banks" ON public.banks FOR SELECT USING (true);
CREATE POLICY "Anyone can view insurance" ON public.insurance_companies FOR SELECT USING (true);
CREATE POLICY "Anyone can view funds" ON public.investment_funds FOR SELECT USING (true);
CREATE POLICY "Anyone can view corpus" ON public.financial_corpus FOR SELECT USING (true);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON public.savings_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_loans_updated_at BEFORE UPDATE ON public.user_loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();