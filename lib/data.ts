import { getSupabaseClient } from "./supabase";
import type { EvidenceCard, Trait } from "@/types/app";

// Supabase 테이블 데이터 타입 정의 (필요한 부분만)
interface EvidenceRow {
  id: string;
  content: string;
  date: string;
  created_at: string;
}

interface TraitRow {
  id: string;
  name: string;
  created_at: string;
}

interface TraitEvidenceRow {
  trait_id: string;
  evidence_id: string;
  evidences: EvidenceRow | null; // Embedded evidence
}

// 근거 저장
export const saveEvidence = async (
  evidence: EvidenceCard
): Promise<EvidenceCard> => {
  try {
    const supabase = getSupabaseClient();
    console.log("근거 저장 시작:", evidence);

    // 이미 존재하는지 확인
    const { data: existingEvidence, error: checkError } = await supabase
      .from("evidences")
      .select("*")
      .eq("id", evidence.id)
      .maybeSingle();

    if (checkError) {
      console.error("근거 확인 오류:", checkError);
    }

    if (existingEvidence) {
      // 업데이트
      const { error: updateError } = await supabase
        .from("evidences")
        .update({
          content: evidence.content,
          date: evidence.date,
        })
        .eq("id", evidence.id);

      if (updateError) {
        console.error("근거 업데이트 오류:", updateError);
        throw updateError;
      }
      console.log("근거 업데이트 완료:", evidence.id);
    } else {
      // 새로 삽입
      const { error: insertError } = await supabase.from("evidences").insert({
        id: evidence.id,
        content: evidence.content,
        date: evidence.date,
      });

      if (insertError) {
        console.error("근거 삽입 오류:", insertError);
        throw insertError;
      }
      console.log("근거 삽입 완료:", evidence.id);
    }

    return evidence;
  } catch (error) {
    console.error("근거 저장 오류:", error);
    throw error;
  }
};

// 근거 내용 업데이트
export const updateEvidenceContent = async (
  evidenceId: string,
  content: string
): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    console.log("근거 내용 업데이트 시작:", evidenceId);

    const { error } = await supabase
      .from("evidences")
      .update({ content }) // content만 업데이트
      .eq("id", evidenceId);

    if (error) {
      console.error("근거 내용 업데이트 오류:", error);
      throw error;
    }

    console.log("근거 내용 업데이트 완료:", evidenceId);
  } catch (error) {
    console.error("근거 내용 업데이트 오류:", error);
    throw error;
  }
};

// 근거 삭제
export const deleteEvidence = async (evidenceId: string): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    console.log("근거 삭제 시작:", evidenceId);

    const { error } = await supabase
      .from("evidences")
      .delete()
      .eq("id", evidenceId);

    if (error) {
      console.error("근거 삭제 오류:", error);
      throw error;
    }

    console.log("근거 삭제 완료:", evidenceId);
  } catch (error) {
    console.error("근거 삭제 오류:", error);
    throw error;
  }
};

// 특성 저장
export const saveTrait = async (trait: Trait): Promise<Trait> => {
  try {
    const supabase = getSupabaseClient();
    console.log("특성 저장 시작:", trait);

    // 이미 존재하는지 확인
    const { data: existingTrait, error: checkError } = await supabase
      .from("traits")
      .select("*")
      .eq("id", trait.id)
      .maybeSingle();

    if (checkError) {
      console.error("특성 확인 오류:", checkError);
    }

    if (existingTrait) {
      // 업데이트
      const { error: updateError } = await supabase
        .from("traits")
        .update({
          name: trait.name,
        })
        .eq("id", trait.id);

      if (updateError) {
        console.error("특성 업데이트 오류:", updateError);
        throw updateError;
      }
      console.log("특성 업데이트 완료:", trait.id);
    } else {
      // 새로 삽입
      const { error: insertError } = await supabase.from("traits").insert({
        id: trait.id,
        name: trait.name,
      });

      if (insertError) {
        console.error("특성 삽입 오류:", insertError);
        throw insertError;
      }
      console.log("특성 삽입 완료:", trait.id);
    }

    return trait;
  } catch (error) {
    console.error("특성 저장 오류:", error);
    throw error;
  }
};

// 특성 업데이트
export const updateTrait = async (
  traitId: string,
  name: string
): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    console.log("특성 이름 업데이트 시작:", traitId, name);

    const { error } = await supabase
      .from("traits")
      .update({ name })
      .eq("id", traitId);

    if (error) {
      console.error("특성 이름 업데이트 오류:", error);
      throw error;
    }

    console.log("특성 이름 업데이트 완료:", traitId);
  } catch (error) {
    console.error("특성 이름 업데이트 오류:", error);
    throw error;
  }
};

// 특성 삭제
export const deleteTrait = async (traitId: string): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    console.log("특성 삭제 시작:", traitId);

    const { error } = await supabase.from("traits").delete().eq("id", traitId);

    if (error) {
      console.error("특성 삭제 오류:", error);
      throw error;
    }

    console.log("특성 삭제 완료:", traitId);
  } catch (error) {
    console.error("특성 삭제 오류:", error);
    throw error;
  }
};

// 특성에 근거 추가
export const addEvidenceToTrait = async (
  traitId: string,
  evidenceId: string
): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    console.log("특성에 근거 추가 시작:", traitId, evidenceId);

    const { error } = await supabase.from("trait_evidences").insert({
      trait_id: traitId,
      evidence_id: evidenceId,
    });

    if (error) {
      console.error("특성에 근거 추가 오류:", error);
      throw error;
    }

    console.log("특성에 근거 추가 완료:", traitId, evidenceId);
  } catch (error) {
    console.error("특성에 근거 추가 오류:", error);
    throw error;
  }
};

// 특성에서 근거 제거
export const removeEvidenceFromTrait = async (
  traitId: string,
  evidenceId: string
): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    console.log("특성에서 근거 제거 시작:", traitId, evidenceId);

    const { error } = await supabase
      .from("trait_evidences")
      .delete()
      .eq("trait_id", traitId)
      .eq("evidence_id", evidenceId);

    if (error) {
      console.error("특성에서 근거 제거 오류:", error);
      throw error;
    }

    console.log("특성에서 근거 제거 완료:", traitId, evidenceId);
  } catch (error) {
    console.error("특성에서 근거 제거 오류:", error);
    throw error;
  }
};

// 모든 데이터 로드
export const loadAllData = async (): Promise<{
  evidences: EvidenceCard[];
  traits: Trait[];
}> => {
  try {
    const supabase = getSupabaseClient();
    console.log("데이터 로드 시작");

    // 근거 로드
    const { data: evidencesData, error: evidencesError } = await supabase
      .from("evidences")
      .select<"*", EvidenceRow>("*"); // 타입 명시

    if (evidencesError) {
      console.error("근거 로드 오류:", evidencesError);
      throw evidencesError;
    }

    console.log("근거 로드 완료:", evidencesData?.length || 0);
    const loadedEvidences = (evidencesData || []) as EvidenceCard[]; // 타입 단언 또는 매핑 필요

    // 특성 로드
    const { data: traitsData, error: traitsError } = await supabase
      .from("traits")
      .select<"*", TraitRow>("*"); // 타입 명시

    if (traitsError) {
      console.error("특성 로드 오류:", traitsError);
      throw traitsError;
    }

    console.log("특성 로드 완료:", traitsData?.length || 0);

    // 특성이 없으면 빈 배열 반환
    if (!traitsData || traitsData.length === 0) {
      return { evidences: loadedEvidences, traits: [] }; // 올바른 타입 사용
    }

    // 특성-근거 연결 로드
    const { data: traitEvidencesData, error: traitEvidencesError } =
      await supabase
        .from("trait_evidences")
        .select<
          `
        trait_id,
        evidence_id,
        evidences:evidence_id (*)
      `,
          TraitEvidenceRow
        >(
          `
        trait_id,
        evidence_id,
        evidences:evidence_id (*)
      `
        ) // 타입 명시
        .in(
          "trait_id",
          traitsData.map((t) => t.id)
        );

    if (traitEvidencesError) {
      console.error("특성-근거 연결 로드 오류:", traitEvidencesError);
      throw traitEvidencesError;
    }

    console.log("특성-근거 연결 로드 완료:", traitEvidencesData?.length || 0);

    // 특성별 근거 매핑
    const traitEvidencesMap: Record<string, EvidenceCard[]> = {};

    if (traitEvidencesData) {
      traitEvidencesData.forEach((te) => {
        // te.evidences가 null이 아니고, 필요한 속성이 모두 있는지 확인
        if (
          te.evidences &&
          te.evidences.id &&
          te.evidences.content &&
          te.evidences.date
        ) {
          const traitId = te.trait_id; // string 타입으로 사용
          if (!traitEvidencesMap[traitId]) {
            traitEvidencesMap[traitId] = [];
          }

          // EvidenceCard 타입으로 매핑
          traitEvidencesMap[traitId].push({
            id: te.evidences.id,
            content: te.evidences.content,
            date: te.evidences.date,
          });
        } else if (te.evidences === null) {
          // console.warn(`Evidence with id ${te.evidence_id} not found for trait ${te.trait_id}`)
        } else {
          console.error(
            "Incomplete evidence data found in trait_evidences:",
            te
          );
        }
      });
    }

    // 특성에 근거 할당
    const traits = traitsData.map(
      (t): Trait => ({
        // 반환 타입 명시
        id: t.id, // string 타입으로 사용
        name: t.name,
        evidences: traitEvidencesMap[t.id] || [], // t.id는 string
      })
    );

    // 특성에 할당된 근거 ID 목록
    const assignedEvidenceIds = new Set(
      traitEvidencesData ? traitEvidencesData.map((te) => te.evidence_id) : []
    );

    // 할당되지 않은 근거만 필터링 및 매핑
    const unassignedEvidences = loadedEvidences.filter(
      (e) => !assignedEvidenceIds.has(e.id)
    );
    // 이미 EvidenceCard[] 타입이므로 추가 매핑 불필요

    console.log("데이터 로드 완료");
    return { evidences: unassignedEvidences, traits }; // 올바른 타입 사용
  } catch (error) {
    console.error("데이터 로드 오류:", error);
    // 오류 발생 시 빈 데이터 반환
    return { evidences: [], traits: [] };
  }
};
