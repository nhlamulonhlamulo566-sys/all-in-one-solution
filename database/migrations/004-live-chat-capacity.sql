ALTER TABLE website_chat_sessions
  ADD KEY idx_website_chat_sessions_assignment_queue (
    status, assigned_to_user_id, created_at, session_id
  );
