import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 생성
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 데이터베이스 초기화 (필요한 테이블 생성)
export const initDatabase = async () => {
  try {
    console.log("데이터베이스 초기화 시작...");

    // 테이블 존재 여부 확인
    const { data: evidencesExists } = await supabase
      .from("evidences")
      .select("id")
      .limit(1)
      .maybeSingle();

    // 테이블이 없으면 초기화 SQL 실행
    if (!evidencesExists) {
      console.log("테이블이 존재하지 않습니다. 테이블을 생성합니다.");
      await createTablesManually();
    } else {
      console.log("테이블이 이미 존재합니다.");
    }

    console.log("데이터베이스 초기화 완료");
    return true;
  } catch (error) {
    console.error("데이터베이스 초기화 오류:", error);
    return false;
  }
};

// 수동으로 테이블 생성
async function createTablesManually() {
  console.log("수동으로 테이블 생성 시작...");

  try {
    // Helper function to execute SQL via RPC
    const executeSql = async (sql: string) => {
      const { error } = await supabase.rpc("execute_sql", { sql_string: sql });
      if (error) throw error;
    };

    // 근거 테이블
    await executeSql(`
      CREATE TABLE IF NOT EXISTS evidences (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        date TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // 특성 테이블
    await executeSql(`
      CREATE TABLE IF NOT EXISTS traits (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // 특성-근거 연결 테이블
    await executeSql(`
      CREATE TABLE IF NOT EXISTS trait_evidences (
        trait_id TEXT REFERENCES traits(id) ON DELETE CASCADE,
        evidence_id TEXT REFERENCES evidences(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (trait_id, evidence_id)
      )
    `);

    console.log("수동으로 테이블 생성 완료");
  } catch (error) {
    console.error("수동 테이블 생성 오류:", error);
    throw error;
  }
}
