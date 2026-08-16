import {CapacitySubmitData, ChronofoldDashboardUI, DurationSubmitData, ModalCommand, TaskDropData, TimerViewData} from "./ChronofoldDashboardUI"
import {ChronofoldLane, ChronofoldTask, INITIAL_TASKS, taskDurationSeconds} from "./ChronofoldSceneContracts"

const TASK_GRAB = requireAsset("../GeneratedSFX/TaskGrab.wav") as AudioTrackAsset
const TASK_DROP = requireAsset("../GeneratedSFX/TaskDrop.wav") as AudioTrackAsset

type PendingAction = "add" | "duration" | "capacity" | "timer" | "tomorrow" | "reschedule" | "remove" | null

@component
export class ChronofoldMain extends BaseScriptComponent {
  @input @hint("Passive UIKit view; schedule and timer state remain owned here")
  dashboard: ChronofoldDashboardUI

  @input("int") @widget(new SliderWidget(1, 1440, 15)) @hint("Default minutes available in the focused day; users can edit this from the Today header")
  capacityMinutes: number = 300

  @input @widget(new SliderWidget(0, 1, 0.05)) @hint("Interaction sound volume")
  sfxVolume: number = 0.55

  @input @hint("Run deterministic action and timer checks in Preview, then restore the original state")
  runFunctionalSelfTestOnStart: boolean = false

  @input @hint("Show the timer-complete state on start for visual QA")
  previewTimerAlertOnStart: boolean = false

  private tasks: ChronofoldTask[] = []
  private grabAudio: AudioComponent
  private dropAudio: AudioComponent
  private refreshEvent: DelayedCallbackEvent
  private pendingDrop: TaskDropData | null = null
  private pendingAction: PendingAction = null
  private selectedTaskKey: string | null = null
  private pendingTaskName: string = ""
  private nextTaskId: number = 1

  private timerTaskKey: string | null = null
  private timerRemainingSeconds: number = 0
  private timerRunning: boolean = false
  private timerStartedAt: number = 0
  private timerStartedRemaining: number = 0
  private timerCompletionHandled: boolean = false
  private lastRenderedTimerSecond: number = -1
  private completionNotificationCount: number = 0

  onAwake(): void {
    this.refreshEvent = this.createEvent("DelayedCallbackEvent")
    this.refreshEvent.bind(() => this.applyPendingDrop())
    this.createEvent("UpdateEvent").bind(() => this.updateTimer())
    this.createEvent("OnStartEvent").bind(() => this.onStart())
  }

  private onStart(): void {
    if (!this.dashboard) {
      print("[Chronofold] ERROR dashboard input is not wired")
      return
    }
    this.tasks = INITIAL_TASKS.map((task) => ({...task, durationSeconds: taskDurationSeconds(task)}))
    this.grabAudio = this.makeAudio("Task Grab Audio", TASK_GRAB)
    this.dropAudio = this.makeAudio("Task Drop Audio", TASK_DROP)
    this.dashboard.onAction.add((action) => this.handleAction(action))
    this.dashboard.onTaskPressed.add((taskKey) => this.handleTaskPressed(taskKey))
    this.dashboard.onNameSubmitted.add((name) => this.handleNameSubmitted(name))
    this.dashboard.onDurationSubmitted.add((duration) => this.handleDurationSubmitted(duration))
    this.dashboard.onCapacitySubmitted.add((capacity) => this.handleCapacitySubmitted(capacity))
    this.dashboard.onModalCommand.add((command) => this.handleModalCommand(command))
    this.dashboard.onTaskGrab.add(() => this.play(this.grabAudio))
    this.dashboard.onTaskDropped.add((drop) => {
      this.pendingDrop = drop
      // Let SIK's MouseInteractor finish its mouse-up frame before the UI
      // rebuild destroys the released card's Interactable hierarchy.
      // Complete TouchEnd before rebuilding the lane layout. Task cards use
      // Chronofold's cursor adapter (not transient SIK Interactables), so this
      // short frame boundary is sufficient and keeps the drop feeling instant.
      this.refreshEvent.reset(drop.hand === "preview" ? 0.08 : 0)
    })
    this.render()
    print("[Chronofold] READY functional spatial schedule loaded")
    if (this.runFunctionalSelfTestOnStart) this.runFunctionalSelfTest()
    if (this.previewTimerAlertOnStart) this.dashboard.showTimerComplete("Build Prototype")
  }

  private handleAction(action: string): void {
    this.clearWorkflow()
    if (action === "capacity") {
      this.pendingAction = "capacity"
      this.dashboard.showCapacityPrompt(this.capacityMinutes)
      return
    }
    if (action === "add") {
      this.pendingAction = "add"
      this.dashboard.showNamePrompt()
      return
    }
    if (action === "duration") {
      this.beginSelection("duration", "ADJUST DURATION", "Which task should use a new duration?")
      return
    }
    if (action === "timer") {
      this.beginSelection("timer", "START TIMER", "Which task should the focus timer track?")
      return
    }
    if (action === "tomorrow") {
      this.beginSelection("tomorrow", "MOVE TOMORROW", "Choose the task to move out of today.")
      return
    }
    if (action === "reschedule") {
      this.beginSelection("reschedule", "RESCHEDULE", "Choose a task, then choose its destination.")
      return
    }
    if (action === "remove") {
      this.beginSelection("remove", "REMOVE TASK", "Choose the task you want to remove.")
    }
  }

  private beginSelection(action: Exclude<PendingAction, "add" | null>, title: string, message: string): void {
    this.pendingAction = action
    this.dashboard.showSelectionPrompt(title, message)
  }

  private handleTaskPressed(taskKey: string): void {
    const task = this.findTask(taskKey)
    if (!task) return
    this.selectedTaskKey = taskKey
    if (this.pendingAction === "duration") {
      this.dashboard.showDurationPrompt(task.label, taskDurationSeconds(task))
      return
    }
    if (this.pendingAction === "tomorrow") {
      this.dashboard.showConfirmation("MOVE TOMORROW", `Move ${task.label} to tomorrow?`, "MOVE")
      return
    }
    if (this.pendingAction === "reschedule") {
      this.dashboard.showDestinationPrompt(task.label)
      return
    }
    if (this.pendingAction === "remove") {
      this.dashboard.showConfirmation("REMOVE TASK", `Remove ${task.label} from the schedule?`, "REMOVE")
      return
    }
    const isActive = this.timerTaskKey === taskKey
    this.pendingAction = "timer"
    this.dashboard.showTimerControls(task.label, isActive ? this.currentTimerRemaining() : taskDurationSeconds(task), this.timerRunning && isActive, isActive)
  }

  private handleNameSubmitted(name: string): void {
    if (this.pendingAction !== "add") return
    this.pendingTaskName = name
    this.dashboard.showDurationPrompt(name, 30 * 60)
  }

  private handleDurationSubmitted(duration: DurationSubmitData): void {
    if (this.pendingAction === "add") {
      this.addTask(this.pendingTaskName, duration.totalSeconds)
    } else if (this.pendingAction === "duration" && this.selectedTaskKey) {
      this.adjustTaskDuration(this.selectedTaskKey, duration.totalSeconds)
    }
    this.clearWorkflow()
    this.play(this.dropAudio)
    this.render()
  }

  private handleCapacitySubmitted(capacity: CapacitySubmitData): void {
    if (this.pendingAction !== "capacity") return
    this.capacityMinutes = capacity.totalMinutes
    console.log(`[Chronofold] CAPACITY ${capacity.hours}h ${capacity.minutes}m (${capacity.totalMinutes}m)`)
    this.clearWorkflow()
    this.play(this.dropAudio)
    this.render()
  }

  private handleModalCommand(command: ModalCommand): void {
    if (command === "cancel") {
      this.clearWorkflow()
      return
    }
    const task = this.selectedTaskKey ? this.findTask(this.selectedTaskKey) : undefined
    if (command === "confirm" && task) {
      if (this.pendingAction === "tomorrow") this.moveTask(task, "tomorrow")
      if (this.pendingAction === "remove") this.removeTask(task.key)
      this.finishMutation()
      return
    }
    if ((command === "destination_today" || command === "destination_tomorrow") && task) {
      const destination: ChronofoldLane = command === "destination_today" ? "today" : "tomorrow"
      if (this.moveTask(task, destination)) this.finishMutation()
      return
    }
    if (command === "timer_start" && task) {
      this.startTimer(task)
      this.clearWorkflow()
      return
    }
    if (command === "timer_pause") {
      this.pauseTimer()
      this.clearWorkflow()
      return
    }
    if (command === "timer_resume") {
      this.resumeTimer()
      this.clearWorkflow()
      return
    }
    if (command === "timer_stop") {
      this.stopTimer()
      this.clearWorkflow()
    }
  }

  private finishMutation(): void {
    this.play(this.dropAudio)
    this.clearWorkflow()
    this.render()
  }

  private addTask(label: string, durationSeconds: number): ChronofoldTask {
    const lane: ChronofoldLane = this.sumLaneSeconds("today") + durationSeconds <= this.capacityMinutes * 60 ? "today" : "overflow"
    const task: ChronofoldTask = {
      key: `custom_${Math.floor(getTime() * 1000)}_${this.nextTaskId++}`,
      label,
      minutes: Math.ceil(durationSeconds / 60),
      durationSeconds,
      lane,
      icon: "timer",
      palette: (this.tasks.length + 2) % 8
    }
    this.tasks.push(task)
    print(`[Chronofold] ADD ${label} ${durationSeconds}s -> ${lane}`)
    return task
  }

  private adjustTaskDuration(taskKey: string, durationSeconds: number): void {
    const task = this.findTask(taskKey)
    if (!task) return
    task.durationSeconds = durationSeconds
    task.minutes = Math.ceil(durationSeconds / 60)
    if (task.lane === "today" && this.sumLaneSeconds("today") > this.capacityMinutes * 60) {
      task.lane = "overflow"
      print(`[Chronofold] ${task.label} moved to overflow after duration change`)
    }
    if (this.timerTaskKey === taskKey && !this.timerRunning) {
      this.timerRemainingSeconds = durationSeconds
      this.lastRenderedTimerSecond = -1
    }
    print(`[Chronofold] DURATION ${task.label} -> ${durationSeconds}s`)
  }

  private moveTask(task: ChronofoldTask, destination: ChronofoldLane): boolean {
    if (destination === "today" && task.lane !== "today") {
      if (this.sumLaneSeconds("today") + taskDurationSeconds(task) > this.capacityMinutes * 60) {
        this.dashboard.showNotice("TODAY IS FULL", `${task.label} needs more room than today has available.`)
        return false
      }
    }
    task.lane = destination
    print(`[Chronofold] MOVE ${task.label} -> ${destination}`)
    return true
  }

  private removeTask(taskKey: string): void {
    const task = this.findTask(taskKey)
    if (!task) return
    if (this.timerTaskKey === taskKey) this.stopTimer()
    this.tasks = this.tasks.filter((item) => item.key !== taskKey)
    print(`[Chronofold] REMOVE ${task.label}`)
  }

  private applyPendingDrop(): void {
    if (!this.pendingDrop) return
    const drop = this.pendingDrop
    this.pendingDrop = null
    if (this.pendingAction) {
      this.render()
      return
    }
    const task = this.findTask(drop.key)
    if (!task) return
    const moved = this.moveTask(task, drop.destination)
    if (moved) {
      this.play(this.dropAudio)
      print(`[Chronofold] HAND DROP ${drop.hand} ${task.label} -> ${drop.destination} @ ${drop.worldX.toFixed(1)}`)
    }
    // Re-render even when capacity rejects the destination so the transiently
    // manipulated card always snaps back into canonical schedule layout.
    this.render()
  }

  private startTimer(task: ChronofoldTask): void {
    if (this.timerTaskKey && this.timerTaskKey !== task.key) {
      print(`[Chronofold] TIMER replacing ${this.timerTaskKey} with ${task.key}`)
    }
    this.timerTaskKey = task.key
    this.timerRemainingSeconds = taskDurationSeconds(task)
    this.timerStartedRemaining = this.timerRemainingSeconds
    this.timerStartedAt = getTime()
    this.timerRunning = true
    this.timerCompletionHandled = false
    this.lastRenderedTimerSecond = -1
    print(`[Chronofold] TIMER START ${task.label} ${this.timerRemainingSeconds}s`)
    this.render()
  }

  private pauseTimer(): void {
    if (!this.timerTaskKey || !this.timerRunning) return
    this.timerRemainingSeconds = this.currentTimerRemaining()
    this.timerRunning = false
    this.lastRenderedTimerSecond = -1
    print(`[Chronofold] TIMER PAUSE ${Math.ceil(this.timerRemainingSeconds)}s`)
    this.render()
  }

  private resumeTimer(): void {
    if (!this.timerTaskKey || this.timerRunning || this.timerRemainingSeconds <= 0) return
    this.timerStartedAt = getTime()
    this.timerStartedRemaining = this.timerRemainingSeconds
    this.timerRunning = true
    this.lastRenderedTimerSecond = -1
    print("[Chronofold] TIMER RESUME")
    this.render()
  }

  private stopTimer(): void {
    if (this.timerTaskKey) print(`[Chronofold] TIMER STOP ${this.timerTaskKey}`)
    this.timerTaskKey = null
    this.timerRemainingSeconds = 0
    this.timerRunning = false
    this.timerStartedRemaining = 0
    this.timerCompletionHandled = false
    this.lastRenderedTimerSecond = -1
    this.render()
  }

  private updateTimer(): void {
    if (!this.timerTaskKey || !this.timerRunning) return
    const remaining = this.currentTimerRemaining()
    const wholeSecond = Math.ceil(remaining)
    if (wholeSecond !== this.lastRenderedTimerSecond) {
      this.lastRenderedTimerSecond = wholeSecond
      this.timerRemainingSeconds = remaining
      this.render()
    }
    if (remaining <= 0) this.completeTimer()
  }

  private currentTimerRemaining(): number {
    if (!this.timerTaskKey) return 0
    if (!this.timerRunning) return Math.max(0, this.timerRemainingSeconds)
    return Math.max(0, this.timerStartedRemaining - (getTime() - this.timerStartedAt))
  }

  private completeTimer(): void {
    if (!this.timerTaskKey || this.timerCompletionHandled) return
    this.timerCompletionHandled = true
    this.timerRemainingSeconds = 0
    this.timerRunning = false
    const task = this.findTask(this.timerTaskKey)
    this.completionNotificationCount += 1
    this.play(this.dropAudio)
    this.render()
    this.dashboard.showTimerComplete(task?.label ?? "Task")
    print(`[Chronofold] TIMER COMPLETE ${task?.label ?? this.timerTaskKey}`)
  }

  private timerView(): TimerViewData | null {
    if (!this.timerTaskKey) return null
    const task = this.findTask(this.timerTaskKey)
    if (!task) return null
    return {taskKey: task.key, taskLabel: task.label, remainingSeconds: this.currentTimerRemaining(), running: this.timerRunning}
  }

  private clearWorkflow(): void {
    this.pendingAction = null
    this.selectedTaskKey = null
    this.pendingTaskName = ""
    this.dashboard.hideModal()
  }

  private findTask(taskKey: string): ChronofoldTask | undefined {
    return this.tasks.find((task) => task.key === taskKey)
  }

  private sumLaneSeconds(lane: ChronofoldLane): number {
    return this.tasks.filter((task) => task.lane === lane).reduce((sum, task) => sum + taskDurationSeconds(task), 0)
  }

  private render(): void {
    this.dashboard.renderSchedule(this.tasks.map((task) => ({...task})), this.capacityMinutes, this.timerView())
    print(`[Chronofold] STATE today=${this.sumLaneSeconds("today")}s overflow=${this.sumLaneSeconds("overflow")}s tomorrow=${this.sumLaneSeconds("tomorrow")}s`)
  }

  private runFunctionalSelfTest(): void {
    const originalTasks = this.tasks.map((task) => ({...task}))
    const originalCapacityMinutes = this.capacityMinutes
    const originalNotificationCount = this.completionNotificationCount
    try {
      this.handleAction("capacity")
      this.assert(!this.dashboard.testSubmitCapacity(0, 0), "capacity rejects zero available time")
      this.dashboard.testPressModal("cancel")
      this.assert(this.capacityMinutes === originalCapacityMinutes && this.pendingAction === null, "capacity cancel leaves availability unchanged")

      this.handleAction("capacity")
      this.assert(this.dashboard.testSubmitCapacity(6, 30), "capacity accepts hours and minutes")
      this.assert(this.capacityMinutes === 390, "capacity updates the focused day")

      this.handleAction("add")
      this.assert(this.dashboard.testSubmitName("Self Test Task"), "add accepts a valid name")
      this.assert(this.dashboard.testSubmitDuration(0, 1, 30), "add accepts h/m/s duration")
      const added = this.tasks.find((task) => task.label === "Self Test Task")
      this.assert(!!added && taskDurationSeconds(added) === 90, "add commits exact seconds")

      this.handleAction("duration")
      this.handleTaskPressed(added!.key)
      this.assert(this.dashboard.testSubmitDuration(0, 2, 5), "adjust accepts replacement duration")
      this.assert(taskDurationSeconds(added!) === 125, "adjust commits replacement duration")

      this.handleAction("tomorrow")
      this.handleTaskPressed(added!.key)
      this.dashboard.testPressModal("primary")
      this.assert(added!.lane === "tomorrow", "move tomorrow changes the lane")

      const overflow = this.tasks.find((task) => task.lane === "overflow")!
      this.handleAction("reschedule")
      this.handleTaskPressed(overflow.key)
      this.dashboard.testPressModal("secondary")
      this.assert(overflow.lane === "tomorrow", "reschedule commits selected destination")

      this.handleAction("remove")
      this.handleTaskPressed(added!.key)
      this.dashboard.testPressModal("primary")
      this.assert(!this.findTask(added!.key), "remove deletes the selected task")

      const timerTask = this.findTask("email")!
      this.handleAction("timer")
      this.handleTaskPressed(timerTask.key)
      this.dashboard.testPressModal("primary")
      this.assert(this.timerTaskKey === timerTask.key && this.timerRunning, "timer starts selected task")
      this.pauseTimer()
      this.assert(!this.timerRunning && this.timerRemainingSeconds > 0, "timer pauses")
      this.resumeTimer()
      this.assert(this.timerRunning, "timer resumes")
      this.timerStartedRemaining = 0
      this.timerStartedAt = getTime() - 1
      this.completeTimer()
      this.completeTimer()
      this.assert(this.completionNotificationCount === originalNotificationCount + 1, "timer completion notifies once")

      const countBeforeCancel = this.tasks.length
      this.handleAction("add")
      this.dashboard.testPressModal("cancel")
      this.assert(this.tasks.length === countBeforeCancel && this.pendingAction === null, "cancel leaves schedule unchanged")
      print("[Chronofold][SELFTEST] PASS all action, validation, timer, notification, and cancel checks")
    } catch (error) {
      console.error(`[Chronofold][SELFTEST] FAIL ${error}`)
    }
    this.tasks = originalTasks
    this.capacityMinutes = originalCapacityMinutes
    this.timerTaskKey = null
    this.timerRemainingSeconds = 0
    this.timerRunning = false
    this.timerCompletionHandled = false
    this.completionNotificationCount = originalNotificationCount
    this.clearWorkflow()
    this.render()
  }

  private assert(condition: boolean, label: string): void {
    if (!condition) throw new Error(label)
    print(`[Chronofold][SELFTEST] PASS ${label}`)
  }

  private makeAudio(name: string, track: AudioTrackAsset): AudioComponent {
    const host = global.scene.createSceneObject(name)
    host.setParent(this.sceneObject)
    const audio = host.createComponent("Component.AudioComponent") as AudioComponent
    audio.playbackMode = Audio.PlaybackMode.LowLatency
    audio.audioTrack = track
    audio.volume = this.sfxVolume
    return audio
  }

  private play(audio: AudioComponent): void {
    if (!audio) return
    audio.position = 0
    audio.play(1)
  }
}
