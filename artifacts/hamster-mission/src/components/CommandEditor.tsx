import React, { useEffect, useRef, useState } from 'react';

import {
  ANGLE_MAX,
  ANGLE_MIN,
  COMMAND_COLORS,
  COMMAND_ICONS,
  COMMAND_LABELS,
  Command,
  CommandType,
  DURATION_MAX,
  ExecutionStatus,
} from '../types';

interface CommandEditorProps {
  commands: Command[];
  currentStep: number;
  collisionStep: number;
  status: ExecutionStatus;

  onAdd: (type: CommandType) => void;
  onRemove: (id: string) => void;
  onRemoveLast: () => void;
  onClearOnly: () => void;
  onReorder: (from: number, to: number) => void;

  onUpdate: (
    id: string,
    updates: Partial<Omit<Command, 'id' | 'type'>>,
  ) => void;
}

interface CommandPreset {
  speed: number;
  duration: number;
  angle: number;
}

const COMMAND_TYPES: CommandType[] = [
  'forward',
  'backward',
  'turnLeft',
  'turnRight',
];

const DEFAULT_PRESETS: Record<CommandType, CommandPreset> = {
  forward: {
    speed: 50,
    duration: 1.5,
    angle: 90,
  },
  backward: {
    speed: 50,
    duration: 1.5,
    angle: 90,
  },
  turnLeft: {
    speed: 50,
    duration: 1,
    angle: 90,
  },
  turnRight: {
    speed: 50,
    duration: 1,
    angle: 90,
  },
};

const STEP_BUTTON_CLASS =
  'min-h-[30px] rounded-lg border border-slate-600 bg-slate-800 px-2 ' +
  'text-xs font-bold text-slate-300 transition hover:bg-slate-700 ' +
  'active:scale-95 disabled:cursor-not-allowed disabled:opacity-40';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function isMoveCommand(type: CommandType): boolean {
  return type === 'forward' || type === 'backward';
}

function CommandControlCard({
  type,
  preset,
  disabled,
  onChange,
  onAdd,
}: {
  type: CommandType;
  preset: CommandPreset;
  disabled: boolean;
  onChange: (next: CommandPreset) => void;
  onAdd: () => void;
}) {
  const color = COMMAND_COLORS[type];
  const isMove = isMoveCommand(type);

  function updateSpeed(value: number) {
    onChange({
      ...preset,
      speed: clamp(Math.round(value), 0, 100),
    });
  }

  function updateDuration(value: number) {
    onChange({
      ...preset,
      duration: roundOne(clamp(value, 0.1, DURATION_MAX)),
    });
  }

  function updateAngle(value: number) {
    onChange({
      ...preset,
      angle: roundOne(clamp(value, ANGLE_MIN, ANGLE_MAX)),
    });
  }

  return (
    <article
      className="overflow-hidden rounded-2xl border-2 bg-slate-900/80"
      style={{ borderColor: color.border }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onAdd}
        className="flex min-h-[48px] w-full items-center justify-between gap-2 px-4 py-2
                   text-left font-jua text-base text-white transition
                   hover:brightness-110 active:scale-[0.99]
                   disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: color.bg }}
        title={`${COMMAND_LABELS[type]} 명령 추가`}
      >
        <span className="flex items-center gap-2">
          <span className="text-xl">{COMMAND_ICONS[type]}</span>
          <span>{COMMAND_LABELS[type]}</span>
        </span>

        <span className="rounded-lg bg-black/20 px-2 py-1 text-xs font-bold">
          + 추가
        </span>
      </button>

      <div className="space-y-4 p-3">
        {isMove ? (
          <>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-300">속도</span>

                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={preset.speed}
                  disabled={disabled}
                  onChange={(event) =>
                    updateSpeed(Number(event.target.value))
                  }
                  className="h-9 w-16 rounded-lg border-2 bg-slate-950 px-2
                             text-right font-mono text-sm font-bold outline-none"
                  style={{
                    borderColor: color.bg,
                    color: color.bg,
                  }}
                />
              </div>

              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={preset.speed}
                disabled={disabled}
                onChange={(event) =>
                  updateSpeed(Number(event.target.value))
                }
                className="h-2 w-full cursor-pointer"
                style={{ accentColor: color.bg }}
              />

              <div className="mt-2 grid grid-cols-4 gap-1">
                {[-10, -1, 1, 10].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    disabled={disabled}
                    onClick={() => updateSpeed(preset.speed + amount)}
                    className={STEP_BUTTON_CLASS}
                  >
                    {amount > 0 ? `+${amount}` : amount}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-300">
                  시간(초)
                </span>

                <input
                  type="number"
                  min={0.1}
                  max={DURATION_MAX}
                  step={0.1}
                  value={preset.duration}
                  disabled={disabled}
                  onChange={(event) =>
                    updateDuration(Number(event.target.value))
                  }
                  className="h-9 w-16 rounded-lg border-2 bg-slate-950 px-2
                             text-right font-mono text-sm font-bold outline-none"
                  style={{
                    borderColor: color.bg,
                    color: color.bg,
                  }}
                />
              </div>

              <input
                type="range"
                min={0.1}
                max={DURATION_MAX}
                step={0.1}
                value={preset.duration}
                disabled={disabled}
                onChange={(event) =>
                  updateDuration(Number(event.target.value))
                }
                className="h-2 w-full cursor-pointer"
                style={{ accentColor: color.bg }}
              />

              <div className="mt-2 grid grid-cols-4 gap-1">
                {[-1, -0.1, 0.1, 1].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      updateDuration(preset.duration + amount)
                    }
                    className={STEP_BUTTON_CLASS}
                  >
                    {amount > 0 ? `+${amount}` : amount}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-700 pt-2 text-center text-xs text-slate-400">
              예상 이동거리{' '}
              <strong className="text-slate-200">
                약{' '}
                {Math.round(
                  (preset.speed / 100) *
                    preset.duration *
                    200,
                )}
                px
              </strong>
            </div>
          </>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-300">각도(°)</span>

              <span
                className="text-lg font-bold"
                style={{ color: color.bg }}
              >
                {formatNumber(preset.angle)}°
              </span>
            </div>

            <input
              type="range"
              min={ANGLE_MIN}
              max={ANGLE_MAX}
              step={0.1}
              value={preset.angle}
              disabled={disabled}
              onChange={(event) =>
                updateAngle(Number(event.target.value))
              }
              className="h-2 w-full cursor-pointer"
              style={{ accentColor: color.bg }}
            />

            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>{ANGLE_MIN}°</span>
              <span>{ANGLE_MAX}°</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1">
              {[-10, -1, -0.1].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  disabled={disabled}
                  onClick={() => updateAngle(preset.angle + amount)}
                  className={STEP_BUTTON_CLASS}
                >
                  {amount}°
                </button>
              ))}
            </div>

            <input
              type="number"
              min={ANGLE_MIN}
              max={ANGLE_MAX}
              step={0.1}
              value={preset.angle}
              disabled={disabled}
              onChange={(event) =>
                updateAngle(Number(event.target.value))
              }
              className="my-2 h-12 w-full rounded-xl border border-slate-600
                         bg-slate-950 text-center font-mono text-lg font-bold
                         text-white outline-none"
            />

            <div className="grid grid-cols-3 gap-1">
              {[0.1, 1, 10].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  disabled={disabled}
                  onClick={() => updateAngle(preset.angle + amount)}
                  className={STEP_BUTTON_CLASS}
                >
                  +{amount}°
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function SequenceCard({
  command,
  index,
  active,
  completed,
  collision,
  disabled,
  draggingOver,
  onRemove,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: {
  command: Command;
  index: number;
  active: boolean;
  completed: boolean;
  collision: boolean;
  disabled: boolean;
  draggingOver: boolean;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const color = COMMAND_COLORS[command.type];
  const isMove = isMoveCommand(command.type);

  return (
    <article
      draggable={!disabled}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver();
      }}
      onDragLeave={onDragLeave}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      onDragEnd={onDragEnd}
      className={[
        'relative min-h-[104px] w-[120px] shrink-0 cursor-grab',
        'overflow-hidden rounded-xl border-2 transition-all',
        draggingOver ? 'translate-y-1 opacity-70' : '',
        active ? 'scale-[1.04] shadow-lg shadow-white/20' : '',
        completed && !active ? 'opacity-70' : '',
      ].join(' ')}
      style={{
        borderColor: collision ? '#ef4444' : color.border,
        background: color.bg,
        outline: active
          ? '3px solid white'
          : collision
            ? '3px solid #ef4444'
            : undefined,
        outlineOffset: '2px',
      }}
    >
      <div className="flex items-center justify-between bg-black/15 px-2 py-1">
        <span className="flex items-center gap-1 text-xs font-bold text-white">
          <span className="rounded-full bg-slate-900/80 px-1.5 py-0.5">
            {index + 1}
          </span>

          {!disabled && <span aria-hidden="true">⠿</span>}
        </span>

        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          className="flex h-6 w-6 items-center justify-center rounded-full
                     bg-black/25 text-sm font-bold text-white transition
                     hover:bg-black/45 disabled:opacity-40"
          aria-label={`${index + 1}번째 명령 삭제`}
        >
          ×
        </button>
      </div>

      <div className="flex min-h-[74px] flex-col items-center justify-center p-2 text-center text-white">
        <strong className="text-sm">
          {COMMAND_ICONS[command.type]}{' '}
          {COMMAND_LABELS[command.type].replace(' 이동', '').replace(' 돌기', '')}
        </strong>

        {isMove ? (
          <span className="mt-2 text-xs leading-5">
            속도 {command.speed}
            <br />
            {formatNumber(command.duration)}초
          </span>
        ) : (
          <span className="mt-2 text-sm font-bold">
            {formatNumber(command.angle)}°
          </span>
        )}

        {active && (
          <span className="mt-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-900">
            실행 중
          </span>
        )}

        {completed && !active && (
          <span className="mt-1 text-xs font-bold">✓ 완료</span>
        )}

        {collision && (
          <span className="mt-1 text-xs font-bold">충돌!</span>
        )}
      </div>
    </article>
  );
}

export function CommandEditor({
  commands,
  currentStep,
  collisionStep,
  status,
  onAdd,
  onRemove,
  onRemoveLast,
  onClearOnly,
  onReorder,
  onUpdate,
}: CommandEditorProps) {
  const isRunning = status === 'running';
  const canEdit = !isRunning;

  const [presets, setPresets] =
    useState<Record<CommandType, CommandPreset>>(DEFAULT_PRESETS);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  /*
   * onAdd는 기존 구조상 type만 받는다.
   * 명령이 추가된 직후 새 명령에 현재 조절값을 적용한다.
   */
  const pendingPreset = useRef<{
    previousLength: number;
    type: CommandType;
    preset: CommandPreset;
  } | null>(null);

  useEffect(() => {
    const pending = pendingPreset.current;

    if (!pending) {
      return;
    }

    if (commands.length <= pending.previousLength) {
      return;
    }

    const addedCommand = commands[commands.length - 1];

    if (addedCommand && addedCommand.type === pending.type) {
      onUpdate(addedCommand.id, {
        speed: pending.preset.speed,
        duration: pending.preset.duration,
        angle: pending.preset.angle,
      });
    }

    pendingPreset.current = null;
  }, [commands, onUpdate]);

  function handlePresetChange(
    type: CommandType,
    next: CommandPreset,
  ) {
    setPresets((previous) => ({
      ...previous,
      [type]: next,
    }));
  }

  function handleAdd(type: CommandType) {
    if (!canEdit) {
      return;
    }

    pendingPreset.current = {
      previousLength: commands.length,
      type,
      preset: { ...presets[type] },
    };

    onAdd(type);
  }

  return (
    <section className="space-y-4">
      <div>
        <div className="mb-2">
          <h2 className="font-jua text-lg text-white">🛠 명령 블록</h2>
          <p className="text-sm text-slate-400">
            값을 조절한 뒤 색깔 제목을 누르면 명령이 추가됩니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {COMMAND_TYPES.map((type) => (
            <CommandControlCard
              key={type}
              type={type}
              preset={presets[type]}
              disabled={isRunning}
              onChange={(next) => handlePresetChange(type, next)}
              onAdd={() => handleAdd(type)}
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/65 p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-jua text-lg text-white">
            내 명령 순서
            <span className="ml-2 text-sm text-blue-400">
              ({commands.length}개)
            </span>
          </h2>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!canEdit || commands.length === 0}
              onClick={onRemoveLast}
              className="min-h-[34px] rounded-lg border border-slate-600
                         bg-slate-800 px-3 text-xs font-bold text-slate-300
                         transition hover:bg-slate-700 active:scale-95
                         disabled:cursor-not-allowed disabled:opacity-40"
            >
              × 마지막 삭제
            </button>

            <button
              type="button"
              disabled={!canEdit || commands.length === 0}
              onClick={onClearOnly}
              className="min-h-[34px] rounded-lg border border-red-500/40
                         bg-red-500/10 px-3 text-xs font-bold text-red-400
                         transition hover:bg-red-500/20 active:scale-95
                         disabled:cursor-not-allowed disabled:opacity-40"
            >
              🗑 모두 지우기
            </button>
          </div>
        </div>

        {commands.length === 0 ? (
          <button
            type="button"
            onClick={() => handleAdd('forward')}
            disabled={!canEdit}
            className="flex min-h-[104px] w-full items-center justify-center
                       rounded-xl border-2 border-dashed border-slate-600
                       text-sm font-bold text-slate-400 transition
                       hover:border-blue-500 hover:text-blue-400
                       disabled:cursor-not-allowed disabled:opacity-40"
          >
            위의 명령 블록을 눌러 명령을 추가하세요.
          </button>
        ) : (
          <div className="flex flex-wrap items-stretch gap-3">
            {commands.map((command, index) => (
              <SequenceCard
                key={command.id}
                command={command}
                index={index}
                active={currentStep === index}
                completed={currentStep > index}
                collision={collisionStep === index}
                disabled={!canEdit}
                draggingOver={dragOverIndex === index}
                onRemove={() => onRemove(command.id)}
                onDragStart={() => setDragIndex(index)}
                onDragOver={() => setDragOverIndex(index)}
                onDragLeave={() => setDragOverIndex(null)}
                onDrop={() => {
                  if (
                    dragIndex !== null &&
                    dragIndex !== index
                  ) {
                    onReorder(dragIndex, index);
                  }

                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
              />
            ))}

            <button
              type="button"
              disabled={!canEdit}
              onClick={() => handleAdd('forward')}
              className="min-h-[104px] w-[120px] shrink-0 rounded-xl
                         border-2 border-dashed border-slate-600
                         text-sm font-bold text-blue-400 transition
                         hover:border-blue-400 hover:bg-blue-500/10
                         active:scale-95 disabled:cursor-not-allowed
                         disabled:opacity-40"
            >
              + 명령 추가
            </button>
          </div>
        )}
      </div>
    </section>
  );
}