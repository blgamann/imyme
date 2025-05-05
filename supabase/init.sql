-- 근거 테이블
CREATE TABLE IF NOT EXISTS evidences (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 특성 테이블
CREATE TABLE IF NOT EXISTS traits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 특성-근거 연결 테이블
CREATE TABLE IF NOT EXISTS trait_evidences (
  trait_id TEXT REFERENCES traits(id) ON DELETE CASCADE,
  evidence_id TEXT REFERENCES evidences(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (trait_id, evidence_id)
);

-- 데이터베이스 초기화 함수
CREATE OR REPLACE FUNCTION init_database()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- 테이블이 이미 존재하는지 확인하고 없으면 생성
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'evidences') THEN
    CREATE TABLE evidences (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;

  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'traits') THEN
    CREATE TABLE traits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;

  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trait_evidences') THEN
    CREATE TABLE trait_evidences (
      trait_id TEXT REFERENCES traits(id) ON DELETE CASCADE,
      evidence_id TEXT REFERENCES evidences(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      PRIMARY KEY (trait_id, evidence_id)
    );
  END IF;
END;
$$;
