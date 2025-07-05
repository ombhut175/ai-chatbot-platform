-- Add user_id column to chat_sessions table for internal chatbot tracking
ALTER TABLE public.chat_sessions
ADD COLUMN user_id uuid REFERENCES public.users(id);

-- Create an index on user_id for better performance
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);

-- Add a comment to explain the purpose
COMMENT ON COLUMN public.chat_sessions.user_id IS 'User ID for internal chatbot sessions. NULL for public chatbot sessions.';
