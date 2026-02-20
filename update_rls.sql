-- 1. 大会(tournaments)の更新・削除権限
-- オーナー本人、または「スーパー管理者」のみが全大会を操作可能。
-- 一般の「管理者」は自分の大会のみ操作可能。
DROP POLICY IF EXISTS "Owners and Admins can update tournaments." ON public.tournaments;
DROP POLICY IF EXISTS "Owners can update their tournaments." ON public.tournaments;
CREATE POLICY "Owners and SuperAdmins can update tournaments." ON public.tournaments 
  FOR UPDATE USING (
    auth.uid() = owner_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "Owners and Admins can delete tournaments." ON public.tournaments;
DROP POLICY IF EXISTS "Owners can delete their tournaments." ON public.tournaments;
CREATE POLICY "Owners and SuperAdmins can delete tournaments." ON public.tournaments 
  FOR DELETE USING (
    auth.uid() = owner_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- 2. チーム(teams)の更新・削除権限
DROP POLICY IF EXISTS "Owners and Admins can update teams." ON public.teams;
DROP POLICY IF EXISTS "Owners can update teams." ON public.teams;
CREATE POLICY "Owners and SuperAdmins can update teams." ON public.teams 
  FOR UPDATE USING (
    auth.uid() = owner_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "Owners can delete teams." ON public.teams;
CREATE POLICY "Owners and SuperAdmins can delete teams." ON public.teams 
  FOR DELETE USING (
    auth.uid() = owner_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- 3. 結果(results)の管理権限
DROP POLICY IF EXISTS "Tournament Owners and Admins can manage results." ON public.results;
DROP POLICY IF EXISTS "Tournament Owners can manage results." ON public.results;
CREATE POLICY "Tournament Owners and SuperAdmins can manage results." ON public.results 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tournaments WHERE id = tournament_id AND (
      owner_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
    ))
  );
