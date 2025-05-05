import { createClient } from "@supabase/supabase-js";

// 클라이언트 사이드에서 사용할 Supabase 클라이언트
let supabaseClient: ReturnType<typeof createClient> | null = null;

// 싱글톤 패턴으로 Supabase 클라이언트 생성
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseClient;
};

// 데이터베이스 초기화 (필요한 테이블 생성)
export const initDatabase = async () => {
  try {
    console.log("데이터베이스 초기화 시작...");
    const supabase = getSupabaseClient();

    // 테이블 존재 여부 확인 - 더 안정적인 방법으로 변경
    try {
      const { data: tablesExist, error } = await supabase.rpc("init_database");

      if (error) {
        console.log("RPC 호출 실패, 수동으로 테이블 확인 시도:", error);

        // 테이블이 존재하는지 직접 확인
        const { error: evidencesError } = await supabase
          .from("evidences")
          .select("id")
          .limit(1);

        if (evidencesError) {
          console.log("테이블이 존재하지 않습니다. 테이블을 생성합니다.");
          await createTablesManually();
        } else {
          console.log("테이블이 이미 존재합니다.");
        }
      } else {
        console.log("데이터베이스 초기화 RPC 성공:", tablesExist);
      }
    } catch (error) {
      console.error("테이블 확인 중 오류:", error);
      await createTablesManually();
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
  const supabase = getSupabaseClient();

  try {
    // 근거 테이블
    await supabase.rpc("execute_sql", {
      sql_query: `
      CREATE TABLE IF NOT EXISTS evidences (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        date TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `,
    });
    console.log("evidences 테이블 생성 완료");

    // 특성 테이블
    await supabase.rpc("execute_sql", {
      sql_query: `
      CREATE TABLE IF NOT EXISTS traits (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `,
    });
    console.log("traits 테이블 생성 완료");

    // 특성-근거 연결 테이블
    await supabase.rpc("execute_sql", {
      sql_query: `
      CREATE TABLE IF NOT EXISTS trait_evidences (
        trait_id TEXT REFERENCES traits(id) ON DELETE CASCADE,
        evidence_id TEXT REFERENCES evidences(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (trait_id, evidence_id)
      )
    `,
    });
    console.log("trait_evidences 테이블 생성 완료");

    console.log("수동으로 테이블 생성 완료");
  } catch (error) {
    console.error("수동 테이블 생성 오류:", error);
    throw error;
  }
}
