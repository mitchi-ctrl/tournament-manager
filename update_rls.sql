-- 1. tournamentsテーブルにシェアコードを追加
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS share_code TEXT UNIQUE;

-- 2. profilesテーブルに解放済み大会リストを追加
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unlocked_tournaments UUID[] DEFAULT '{}';

-- 3. 大会の閲覧権限 (SELECT) を厳格化
-- 主催者、スーパー管理者、またはアクセスコードを入力済みのユーザーのみが閲覧可能。
DROP POLICY IF EXISTS "Tournaments are viewable by everyone." ON public.tournaments;
CREATE POLICY "Protected tournament access." ON public.tournaments 
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (
      role = 'superadmin' OR 
      unlocked_tournaments @> ARRAY[id]
    ))
  );

-- 4. 関連データの閲覧権限も大会の閲覧権限に連動させる
-- teams の閲覧権限
DROP POLICY IF EXISTS "Teams are viewable by everyone." ON public.teams;
CREATE POLICY "Teams viewable via tournament access." ON public.teams
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tournaments WHERE id = tournament_id)
  );

-- results の閲覧権限
DROP POLICY IF EXISTS "Results are viewable by everyone." ON public.results;
CREATE POLICY "Results viewable via tournament access." ON public.results
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tournaments WHERE id = tournament_id)
  );

-- messages の閲覧権限
DROP POLICY IF EXISTS "Messages are viewable by accessible tournament members." ON public.messages;
CREATE POLICY "Messages viewable via tournament access." ON public.messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tournaments WHERE id = tournament_id)
  );

-- 5. シェアコードによる大会解放のためのRPC
CREATE OR REPLACE FUNCTION unlock_tournament_by_code(code_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_id UUID;
  result_data JSONB;
BEGIN
  -- コードに一致する大会を探す
  SELECT id INTO target_id FROM public.tournaments WHERE share_code = code_input;

  IF target_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', '無効なアクセスコードです');
  END IF;

  -- ユーザーのプロフィールの unlocked_tournaments に追加 (重複を避ける)
  UPDATE public.profiles 
  SET unlocked_tournaments = array_append(ARRAY(SELECT unnest(unlocked_tournaments) EXCEPT SELECT target_id), target_id)
  WHERE id = auth.uid();

  RETURN jsonb_build_object('success', true, 'tournament_id', target_id);
END;
$$;
