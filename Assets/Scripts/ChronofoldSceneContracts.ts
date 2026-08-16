export type ChronofoldLane = "today" | "overflow" | "tomorrow"

export type ChronofoldTask = {
  key: string
  label: string
  minutes: number
  durationSeconds?: number
  lane: ChronofoldLane
  icon: string
  palette: number
  halfWidth?: boolean
}

export function taskDurationSeconds(task: ChronofoldTask): number {
  return task.durationSeconds ?? task.minutes * 60
}

export const CHRONOFOLD_SCENE = {
  appRoot: "Chronofold App",
  dashboard: "Chronofold Dashboard"
}

export const INITIAL_TASKS: ChronofoldTask[] = [
  {key: "email", label: "Email & Planning", minutes: 30, lane: "today", icon: "mail", palette: 0, halfWidth: true},
  {key: "standup", label: "Team Standup", minutes: 30, lane: "today", icon: "groups", palette: 1, halfWidth: true},
  {key: "prototype", label: "Build Prototype", minutes: 120, lane: "today", icon: "memory", palette: 2},
  {key: "client", label: "Client Meeting", minutes: 30, lane: "today", icon: "videocam", palette: 3, halfWidth: true},
  {key: "lunch", label: "Lunch Break", minutes: 30, lane: "today", icon: "local_cafe", palette: 4, halfWidth: true},
  {key: "review", label: "Design Review", minutes: 60, lane: "today", icon: "edit", palette: 5},
  {key: "workout", label: "Workout", minutes: 60, lane: "overflow", icon: "fitness_center", palette: 6},
  {key: "grocery", label: "Grocery Run", minutes: 45, lane: "overflow", icon: "grocery", palette: 7}
]
