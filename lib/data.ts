import { supabase } from "./supabase";
import type { EvidenceCard, Trait } from "@/types/app";

// 근거 저장
export const saveEvidence = async (
  evidence: EvidenceCard
): Promise<EvidenceCard> => {
  try {
    // 이미 존재하는지 확인
    const { data: existingEvidence } = await supabase
      .from("evidences")
      .select("*")
      .eq("id", evidence.id)
      .maybeSingle();

    if (existingEvidence) {
      // 업데이트
      await supabase
        .from("evidences")
        .update({
          content: evidence.content,
          date: evidence.date,
        })
        .eq("id", evidence.id);
    } else {
      // 새로 삽입
      await supabase.from("evidences").insert({
        id: evidence.id,
        content: evidence.content,
        date: evidence.date,
      });
    }

    return evidence;
  } catch (error) {
    console.error("근거 저장 오류:", error);
    return evidence;
  }
};

// 근거 삭제
export const deleteEvidence = async (evidenceId: string): Promise<void> => {
  try {
    await supabase.from("evidences").delete().eq("id", evidenceId);
  } catch (error) {
    console.error("근거 삭제 오류:", error);
  }
};

// 특성 저장
export const saveTrait = async (trait: Trait): Promise<Trait> => {
  try {
    // 이미 존재하는지 확인
    const { data: existingTrait } = await supabase
      .from("traits")
      .select("*")
      .eq("id", trait.id)
      .maybeSingle();

    if (existingTrait) {
      // 업데이트
      await supabase
        .from("traits")
        .update({
          name: trait.name,
        })
        .eq("id", trait.id);
    } else {
      // 새로 삽입
      await supabase.from("traits").insert({
        id: trait.id,
        name: trait.name,
      });
    }

    return trait;
  } catch (error) {
    console.error("특성 저장 오류:", error);
    return trait;
  }
};

// 특성 업데이트
export const updateTrait = async (
  traitId: string,
  name: string
): Promise<void> => {
  try {
    await supabase.from("traits").update({ name }).eq("id", traitId);
  } catch (error) {
    console.error("특성 업데이트 오류:", error);
  }
};

// 특성 삭제
export const deleteTrait = async (traitId: string): Promise<void> => {
  try {
    await supabase.from("traits").delete().eq("id", traitId);
  } catch (error) {
    console.error("특성 삭제 오류:", error);
  }
};

// 특성에 근거 추가
export const addEvidenceToTrait = async (
  traitId: string,
  evidenceId: string
): Promise<void> => {
  try {
    await supabase.from("trait_evidences").insert({
      trait_id: traitId,
      evidence_id: evidenceId,
    });
  } catch (error) {
    console.error("특성에 근거 추가 오류:", error);
  }
};

// 특성에서 근거 제거
export const removeEvidenceFromTrait = async (
  traitId: string,
  evidenceId: string
): Promise<void> => {
  try {
    await supabase
      .from("trait_evidences")
      .delete()
      .eq("trait_id", traitId)
      .eq("evidence_id", evidenceId);
  } catch (error) {
    console.error("특성에서 근거 제거 오류:", error);
  }
};

// 모든 데이터 로드
export const loadAllData = async (): Promise<{
  evidences: EvidenceCard[];
  traits: Trait[];
}> => {
  try {
    // 근거 로드
    const { data: evidencesData } = await supabase
      .from("evidences")
      .select("*");

    // 특성 로드
    const { data: traitsData } = await supabase.from("traits").select("*");

    // 특성이 없으면 빈 배열 반환
    if (!traitsData || traitsData.length === 0) {
      return { evidences: evidencesData || [], traits: [] };
    }

    // 특성-근거 연결 로드
    // Define an interface for the joined data structure
    interface TraitEvidenceJoin {
      trait_id: string;
      evidence_id: string;
      evidences: {
        id: string;
        content: string;
        date: string;
      } | null; // The related evidence, or null if not found
    }

    const {
      data: traitEvidencesDataUntyped, // Use a temporary name
    } = await supabase
      .from("trait_evidences")
      .select(
        `
        trait_id,
        evidence_id,
        evidences:evidence_id (*)
      `
      )
      .in(
        "trait_id",
        traitsData.map((t) => t.id)
      );

    // Cast the data to the defined type
    const traitEvidencesData = traitEvidencesDataUntyped as
      | TraitEvidenceJoin[]
      | null;

    // 특성별 근거 매핑
    const traitEvidencesMap: Record<string, EvidenceCard[]> = {};

    if (traitEvidencesData) {
      traitEvidencesData.forEach((te) => {
        // Check if the related evidence exists
        if (!te.evidences) return;

        if (!traitEvidencesMap[te.trait_id]) {
          traitEvidencesMap[te.trait_id] = [];
        }

        // Now te.evidences is correctly typed as an object
        traitEvidencesMap[te.trait_id].push({
          id: te.evidences.id,
          content: te.evidences.content,
          date: te.evidences.date,
        });
      });
    }

    // 특성에 근거 할당
    const traits = traitsData.map((t) => ({
      id: t.id,
      name: t.name,
      evidences: traitEvidencesMap[t.id] || [],
    }));

    // 특성에 할당된 근거 ID 목록
    const assignedEvidenceIds = new Set(
      traitEvidencesData ? traitEvidencesData.map((te) => te.evidence_id) : []
    );

    // 할당되지 않은 근거만 반환
    const evidences = (evidencesData || [])
      .filter((e) => !assignedEvidenceIds.has(e.id))
      .map((e) => ({
        id: e.id,
        content: e.content,
        date: e.date,
      }));

    return { evidences, traits };
  } catch (error) {
    console.error("데이터 로드 오류:", error);
    // 오류 발생 시 빈 데이터 반환
    return { evidences: [], traits: [] };
  }
};
