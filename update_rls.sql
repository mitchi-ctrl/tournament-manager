-- 1. Profilesテーブルの削除権限をスーパー管理者に付与
DROP POLICY IF EXISTS "SuperAdmins can delete profiles." ON public.profiles;
CREATE POLICY "SuperAdmins can delete profiles." ON public.profiles 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- 2. Auth.users を削除するためのセキュアな関数 (RPC)
-- これにより、管理画面からアカウント自体を完全に削除できるようになります。
CREATE OR REPLACE FUNCTION delete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- 特権（Service Role相当）で実行
SET search_path = public
AS $$
BEGIN
  -- 実行者がスーパー管理者であることを再確認
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  ) THEN
    -- auth.users から削除（profiles など CASCADE 設定されているテーブルも連動して削除されます）
    DELETE FROM auth.users WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Only superadmins can delete users';
  END IF;
END;
$$;
