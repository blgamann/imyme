"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  pointerWithin,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Trash2, GripVertical, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { EvidenceCard, Trait } from "@/types/app";
import { initDatabase } from "@/lib/supabase";
import {
  saveEvidence,
  saveTrait,
  updateTrait,
  deleteEvidence,
  deleteTrait,
  addEvidenceToTrait as addEvidenceToTraitAPI,
  removeEvidenceFromTrait as removeEvidenceFromTraitAPI,
  loadAllData,
} from "@/lib/data";

// 삭제 확인 대화상자 컴포넌트
function DeleteConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  onConfirm,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>삭제</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// 드래그 가능한 근거 카드 컴포넌트
function DraggableEvidenceCardComponent({
  evidence,
  onDelete,
}: {
  evidence: EvidenceCard;
  onDelete: () => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: evidence.id,
      data: {
        type: "evidence",
        evidence,
      },
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={`mb-3 border-2 ${
          isDragging ? "opacity-50 border-primary" : "hover:border-primary"
        }`}
      >
        <CardHeader className="p-3 pb-0">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {evidence.date}
            </span>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-6 w-6"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div {...attributes} {...listeners} className="cursor-move">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          <p className="text-sm">{evidence.content}</p>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="근거 삭제"
        description="이 근거를 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={() => {
          onDelete();
          setShowDeleteConfirm(false);
        }}
      />
    </>
  );
}

// 일반 근거 카드 컴포넌트 (드래그 오버레이용)
function EvidenceCardComponent({ evidence }: { evidence: EvidenceCard }) {
  return (
    <Card className="mb-3 border-2 border-primary">
      <CardHeader className="p-3 pb-0">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{evidence.date}</span>
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <p className="text-sm">{evidence.content}</p>
      </CardContent>
    </Card>
  );
}

// 특성 컴포넌트
function TraitSection({
  trait,
  onRemoveEvidence,
  onChangeName,
  onDelete,
}: {
  trait: Trait;
  onRemoveEvidence: (evidenceId: string) => void;
  onChangeName: (name: string) => void;
  onDelete: () => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: trait.id,
    data: {
      type: "trait",
      trait,
    },
  });

  return (
    <>
      <Card
        ref={setNodeRef}
        className={`mb-4 ${isOver ? "border-primary border-2" : ""}`}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <Input
              value={trait.name}
              onChange={(e) => onChangeName(e.target.value)}
              className="font-semibold text-lg border-0 p-0 h-auto focus-visible:ring-0"
              placeholder="특성 이름을 입력하세요"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {trait.evidences.length === 0 ? (
            <div
              className={`text-center py-8 text-muted-foreground border-2 border-dashed rounded-md ${
                isOver ? "bg-primary/10" : ""
              }`}
            >
              근거를 이곳으로 드래그하세요
            </div>
          ) : (
            <div>
              {trait.evidences.map((evidence) => (
                <Card key={evidence.id} className="mb-3 border">
                  <CardHeader className="p-3 pb-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {evidence.date}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveEvidence(evidence.id)}
                        className="h-6 w-6"
                        title="근거 섹션으로 되돌리기"
                      >
                        <CornerDownLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <p className="text-sm">{evidence.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="특성 삭제"
        description={`'${trait.name}' 특성을 정말로 삭제하시겠습니까? 이 특성에 포함된 모든 근거는 근거 섹션으로 이동됩니다.`}
        onConfirm={() => {
          onDelete();
          setShowDeleteConfirm(false);
        }}
      />
    </>
  );
}

export default function SelfDiscoveryApp() {
  // 근거 목록 상태
  const [evidences, setEvidences] = useState<EvidenceCard[]>([]);
  // 특성 목록 상태
  const [traits, setTraits] = useState<Trait[]>([
    { id: "trait-1", name: "특성 1", evidences: [] },
  ]);
  // 새 근거 입력 상태
  const [newEvidence, setNewEvidence] = useState("");
  // 현재 드래그 중인 아이템
  const [activeId, setActiveId] = useState<string | null>(null);
  // 초기화 완료 상태
  const [isInitialized, setIsInitialized] = useState(false);

  // 데이터 초기 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // 데이터베이스 초기화
        const initialized = await initDatabase().catch((err) => {
          console.error("데이터베이스 초기화 실패:", err);
          return false;
        });

        setIsInitialized(initialized);

        if (initialized) {
          // 데이터 로드
          const data = await loadAllData().catch((err) => {
            console.error("데이터 로드 실패:", err);
            return { evidences: [], traits: [] };
          });

          // 데이터가 있으면 상태 업데이트
          if (data.traits.length > 0) {
            setTraits(data.traits);
          }

          setEvidences(data.evidences);

          toast({
            title: "데이터 로드 완료",
            description: "저장된 데이터를 성공적으로 불러왔습니다.",
          });
        }
      } catch (error) {
        console.error("데이터 로드 오류:", error);
        toast({
          title: "데이터 로드 실패",
          description: "데이터를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, []);

  // 새 근거 추가 함수
  const addEvidence = () => {
    if (newEvidence.trim() === "") return;

    const newEvidenceCard: EvidenceCard = {
      id: `evidence-${Date.now()}`,
      content: newEvidence,
      date: new Date().toLocaleDateString(),
    };

    // 상태 업데이트 (Optimistic UI)
    setEvidences([...evidences, newEvidenceCard]);
    setNewEvidence("");

    // 백그라운드에서 데이터베이스 업데이트
    if (isInitialized) {
      saveEvidence(newEvidenceCard).catch((error) => {
        console.error("근거 추가 오류:", error);
        toast({
          title: "근거 추가 실패",
          description: "근거를 추가하는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      });
    }
  };

  // 근거 삭제 함수
  const removeEvidence = (id: string) => {
    // 상태 업데이트 (Optimistic UI)
    setEvidences(evidences.filter((e) => e.id !== id));

    // 백그라운드에서 데이터베이스 업데이트
    if (isInitialized) {
      deleteEvidence(id).catch((error) => {
        console.error("근거 삭제 오류:", error);
        toast({
          title: "근거 삭제 실패",
          description: "근거를 삭제하는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      });
    }
  };

  // 특성 추가 함수
  const addTrait = () => {
    const newTrait: Trait = {
      id: `trait-${Date.now()}`,
      name: `특성 ${traits.length + 1}`,
      evidences: [],
    };

    // 상태 업데이트 (Optimistic UI)
    setTraits([...traits, newTrait]);

    // 백그라운드에서 데이터베이스 업데이트
    if (isInitialized) {
      saveTrait(newTrait).catch((error) => {
        console.error("특성 추가 오류:", error);
        toast({
          title: "특성 추가 실패",
          description: "특성을 추가하는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      });
    }
  };

  // 특성 이름 변경 함수
  const changeTraitName = (id: string, name: string) => {
    // 상태 업데이트 (Optimistic UI)
    setTraits(traits.map((t) => (t.id === id ? { ...t, name } : t)));

    // 백그라운드에서 데이터베이스 업데이트
    if (isInitialized) {
      updateTrait(id, name).catch((error) => {
        console.error("특성 이름 변경 오류:", error);
        toast({
          title: "특성 이름 변경 실패",
          description: "특성 이름을 변경하는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      });
    }
  };

  // 특성 삭제 함수
  const removeTrait = (id: string) => {
    // 특성에 있는 근거들을 다시 근거 섹션으로 되돌림
    const traitToRemove = traits.find((t) => t.id === id);
    if (traitToRemove) {
      setEvidences([...evidences, ...traitToRemove.evidences]);
    }

    // 상태 업데이트 (Optimistic UI)
    setTraits(traits.filter((t) => t.id !== id));

    // 백그라운드에서 데이터베이스 업데이트
    if (isInitialized) {
      deleteTrait(id).catch((error) => {
        console.error("특성 삭제 오류:", error);
        toast({
          title: "특성 삭제 실패",
          description: "특성을 삭제하는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      });
    }
  };

  // 특성에 근거 추가 함수
  const addEvidenceToTrait = (traitId: string, evidenceId: string) => {
    const evidence = evidences.find((e) => e.id === evidenceId);
    if (!evidence) return;

    // Optimistic UI 업데이트 - 즉시 UI 반영
    setTraits(
      traits.map((t) => {
        if (t.id === traitId) {
          return { ...t, evidences: [...t.evidences, evidence] };
        }
        return t;
      })
    );

    // 근거 섹션에서 제거
    setEvidences(evidences.filter((e) => e.id !== evidenceId));

    // 백그라운드에서 데이터베이스 업데이트
    if (isInitialized) {
      addEvidenceToTraitAPI(traitId, evidenceId).catch((error) => {
        console.error("근거 이동 오류:", error);

        // 실패 시 UI 롤백 (선택적)
        // setTraits(previousTraits)
        // setEvidences(previousEvidences)

        toast({
          title: "근거 이동 실패",
          description: "근거를 이동하는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      });
    }
  };

  // 특성에서 근거 제거 함수
  const removeEvidenceFromTrait = (traitId: string, evidenceId: string) => {
    const trait = traits.find((t) => t.id === traitId);
    if (!trait) return;

    const evidence = trait.evidences.find((e) => e.id === evidenceId);
    if (!evidence) return;

    // Optimistic UI 업데이트 - 즉시 UI 반영
    setTraits(
      traits.map((t) => {
        if (t.id === traitId) {
          return {
            ...t,
            evidences: t.evidences.filter((e) => e.id !== evidenceId),
          };
        }
        return t;
      })
    );

    // 근거 섹션으로 되돌림
    setEvidences([...evidences, evidence]);

    // 백그라운드에서 데이터베이스 업데이트
    if (isInitialized) {
      removeEvidenceFromTraitAPI(traitId, evidenceId).catch((error) => {
        console.error("근거 되돌리기 오류:", error);

        // 실패 시 UI 롤백 (선택적)
        // setTraits(previousTraits)
        // setEvidences(previousEvidences)

        toast({
          title: "근거 되돌리기 실패",
          description: "근거를 되돌리는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      });
    }
  };

  // 드래그 시작 처리 함수
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id.toString());
  };

  // 드래그 종료 처리 함수
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    // 근거 카드가 드래그된 경우
    if (active.data.current?.type === "evidence") {
      const evidenceId = active.id.toString();

      // 특성 섹션 위에 드롭된 경우에만 이동
      if (over && over.data.current?.type === "trait") {
        const traitId = over.id.toString();

        // 즉시 UI 업데이트를 위해 직접 함수 호출
        addEvidenceToTrait(traitId, evidenceId);
      }
      // 특성 섹션 외부에 드롭된 경우는 아무 작업도 하지 않음
      // 근거 카드는 원래 위치에 그대로 남음
    }
  };

  // 현재 드래그 중인 근거 카드 찾기
  const getActiveEvidence = () => {
    if (!activeId) return null;
    return evidences.find((e) => e.id === activeId);
  };

  const activeEvidence = getActiveEvidence();

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-3xl font-bold text-center mb-8">imyme</h1>

      <DndContext
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 근거 섹션 */}
          <div>
            <h2 className="text-xl font-semibold mb-4">근거 수집</h2>
            <Card className="mb-4">
              <CardContent className="pt-6">
                <Textarea
                  placeholder="새로운 근거를 입력하세요..."
                  value={newEvidence}
                  onChange={(e) => setNewEvidence(e.target.value)}
                  className="resize-none mb-2"
                  rows={3}
                />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={addEvidence}>
                  <Plus className="mr-2 h-4 w-4" /> 근거 추가
                </Button>
              </CardFooter>
            </Card>

            <div className="space-y-3">
              {evidences.map((evidence) => (
                <DraggableEvidenceCardComponent
                  key={evidence.id}
                  evidence={evidence}
                  onDelete={() => removeEvidence(evidence.id)}
                />
              ))}

              {evidences.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-md">
                  수집된 근거가 없습니다
                </div>
              )}
            </div>
          </div>

          {/* 특성 섹션 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">나의 특성</h2>
              <Button variant="outline" onClick={addTrait}>
                <Plus className="mr-2 h-4 w-4" /> 특성 추가
              </Button>
            </div>

            {traits.map((trait) => (
              <TraitSection
                key={trait.id}
                trait={trait}
                onRemoveEvidence={(evidenceId) =>
                  removeEvidenceFromTrait(trait.id, evidenceId)
                }
                onChangeName={(name) => changeTraitName(trait.id, name)}
                onDelete={() => removeTrait(trait.id)}
              />
            ))}
          </div>
        </div>

        {/* 드래그 오버레이 */}
        {activeEvidence && (
          <DragOverlay>
            <EvidenceCardComponent evidence={activeEvidence} />
          </DragOverlay>
        )}
      </DndContext>
    </div>
  );
}
