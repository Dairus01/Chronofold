import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {HandInputData} from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/HandInputData"
import {BaseHand} from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/BaseHand"
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"
import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {Slider} from "SpectaclesUIKit.lspkg/Scripts/Components/Slider/Slider"
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {FlexAlign, FlexDirection, FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import {GradientParameters} from "SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangle"
import {RoundedRectangleVisual} from "SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangleVisual"
import {ChronofoldLane, ChronofoldTask, taskDurationSeconds} from "./ChronofoldSceneContracts"

const THEME_FONT = requireAsset("../Fonts/Space Grotesk.ttf") as Font
const IMAGE_MATERIAL = requireAsset("../Materials/ImageMaterial.mat") as Material

const ICONS: {[key: string]: Texture} = {
  add_circle: requireAsset("../Icons/add_circle.png") as Texture,
  timer: requireAsset("../Icons/timer.png") as Texture,
  arrow_forward: requireAsset("../Icons/arrow_forward.png") as Texture,
  swap_horiz: requireAsset("../Icons/swap_horiz.png") as Texture,
  delete: requireAsset("../Icons/delete.png") as Texture,
  groups: requireAsset("../Icons/groups.png") as Texture,
  memory: requireAsset("../Icons/memory.png") as Texture,
  videocam: requireAsset("../Icons/videocam.png") as Texture,
  local_cafe: requireAsset("../Icons/local_cafe.png") as Texture,
  edit: requireAsset("../Icons/edit.png") as Texture,
  fitness_center: requireAsset("../Icons/fitness_center.png") as Texture,
  drag_indicator: requireAsset("../Icons/drag_indicator.png") as Texture,
  unfold_more: requireAsset("../Icons/unfold_more.png") as Texture,
  refresh: requireAsset("../Icons/refresh.png") as Texture,
  my_location: requireAsset("../Icons/my_location.png") as Texture,
  check_circle: requireAsset("../Icons/check_circle.png") as Texture,
  mail: requireAsset("../Icons/mail.png") as Texture,
  grocery: requireAsset("../Icons/grocery.png") as Texture,
  view_timeline: requireAsset("../Icons/view_timeline.png") as Texture
}

const FONT_SIZE_SCALE = 2.15
const ICON_SIZE_SCALE = 1.50
const LAYOUT_Z_LIFT = 0.04

// One coherent landscape layout specification. Horizontal dimensions are
// deliberately generous to match the hero composition while vertical sizes
// remain stable so the dashboard does not clip at the top or bottom.
const LAYOUT = {
  actions: {x: -40.5, width: 22.0, buttonWidth: 20.4},
  today: {x: 0.0, width: 54.0, innerWidth: 50.0, halfWidth: 24.5},
  overflow: {x: 39.8, width: 21.5, cardWidth: 18.5},
  statusWidth: 54.0,
  toolbarWidth: 60.0,
  toolbarChipWidth: 13.7,
  brandX: -50.0
} as const

type TextRole = "Title1" | "Title2" | "HeadlineXL" | "Headline1" | "Headline2" | "Subheadline" | "Button" | "Callout" | "Body" | "Caption"
const TYPE_SCALE: Record<TextRole, {size: number; weight: number}> = {
  Title1: {size: 105, weight: 700}, Title2: {size: 93, weight: 700},
  HeadlineXL: {size: 62, weight: 700}, Headline1: {size: 54, weight: 700},
  Headline2: {size: 48, weight: 700}, Subheadline: {size: 41, weight: 700},
  Button: {size: 39, weight: 500}, Callout: {size: 39, weight: 700},
  Body: {size: 39, weight: 500}, Caption: {size: 38, weight: 500}
}

function applyTextRole(t: Text, role: TextRole): void {
  t.size = TYPE_SCALE[role].size * FONT_SIZE_SCALE
  ;(t as Text & {weight?: number}).weight = TYPE_SCALE[role].weight
}

export type TaskDropData = {key: string; destination: ChronofoldLane; worldX: number; hand: "left" | "right" | "preview" | "unknown"}
export type DurationSubmitData = {hours: number; minutes: number; seconds: number; totalSeconds: number}
export type CapacitySubmitData = {hours: number; minutes: number; totalMinutes: number}
export type TimerViewData = {taskKey: string; taskLabel: string; remainingSeconds: number; running: boolean}
export type ModalCommand = "cancel" | "confirm" | "destination_today" | "destination_tomorrow" | "timer_start" | "timer_pause" | "timer_resume" | "timer_stop"

type ModalMode = "hidden" | "name" | "duration" | "capacity" | "selection" | "confirm" | "destination" | "timer" | "notice" | "timer_complete"

type Palette = {a: vec4; b: vec4; border: vec4; icon: vec4}
type HandKind = "left" | "right"
type HandDragTarget = {
  key: string
  label: string
  card: SceneObject
  handle: SceneObject
  width: number
  height: number
}
type ActiveHandDrag = {
  handType: HandKind
  hand: BaseHand
  target: HandDragTarget
  startPinch: vec3
  startCard: vec3
  moved: boolean
  originalStatus: string
  originalBreakdown: string
  originalStatusColor: vec4
}
type ActiveCursorDrag = {
  touchId: number
  target: HandDragTarget
  depth: number
  startPointer: vec3
  startCard: vec3
  moved: boolean
  originalStatus: string
  originalBreakdown: string
  originalStatusColor: vec4
}
const PALETTES: Palette[] = [
  {a: new vec4(0.08, 0.62, 1.00, 0.98), b: new vec4(0.02, 0.28, 0.78, 0.98), border: new vec4(0.35, 0.78, 1, 0.85), icon: new vec4(0.82, 0.94, 1, 1)},
  {a: new vec4(0.58, 0.28, 0.92, 0.98), b: new vec4(0.28, 0.10, 0.58, 0.98), border: new vec4(0.82, 0.66, 1, 0.85), icon: new vec4(0.92, 0.84, 1, 1)},
  {a: new vec4(1.00, 0.48, 0.04, 0.98), b: new vec4(0.70, 0.17, 0.01, 0.98), border: new vec4(1, 0.68, 0.30, 0.88), icon: new vec4(1, 0.88, 0.66, 1)},
  {a: new vec4(1.00, 0.72, 0.03, 0.98), b: new vec4(0.62, 0.34, 0.01, 0.98), border: new vec4(1, 0.88, 0.32, 0.88), icon: new vec4(1, 0.94, 0.66, 1)},
  {a: new vec4(0.02, 0.82, 0.72, 0.98), b: new vec4(0.01, 0.42, 0.38, 0.98), border: new vec4(0.34, 1, 0.91, 0.86), icon: new vec4(0.78, 1, 0.97, 1)},
  {a: new vec4(0.34, 0.88, 0.08, 0.98), b: new vec4(0.10, 0.46, 0.02, 0.98), border: new vec4(0.55, 1, 0.34, 0.86), icon: new vec4(0.82, 1, 0.72, 1)},
  {a: new vec4(0.67, 0.18, 0.30, 0.96), b: new vec4(0.31, 0.06, 0.14, 0.98), border: new vec4(1, 0.43, 0.57, 0.76), icon: new vec4(1, 0.72, 0.79, 1)},
  {a: new vec4(0.48, 0.16, 0.55, 0.96), b: new vec4(0.22, 0.06, 0.28, 0.98), border: new vec4(0.91, 0.47, 1, 0.74), icon: new vec4(0.96, 0.75, 1, 1)}
]

@component
export class ChronofoldDashboardUI extends BaseScriptComponent {
  @ui.label('<span style="color:#62F5A8;">Chronofold spatial dashboard</span>')
  @input @widget(new SliderWidget(0.75, 1.15, 0.01)) @hint("Global scale for the complete dashboard")
  globalScale: number = 1.08

  @input @widget(new SliderWidget(0.5, 1.6, 0.05)) @hint("Spacing between primary panels")
  panelGap: number = 0.9

  @input @hint("Primary text color")
  primaryTextColor: vec4 = new vec4(0.95, 0.98, 1, 1)

  @input @hint("Positive capacity and success accent")
  successColor: vec4 = new vec4(0.31, 1, 0.62, 1)

  @input @hint("Overflow and warning accent")
  dangerColor: vec4 = new vec4(1, 0.29, 0.40, 1)

  @input @widget(new SliderWidget(0.55, 1, 0.01)) @hint("Opacity of dark glass surfaces")
  panelOpacity: number = 0.88

  private actionEvent = new Event<string>()
  private taskPressedEvent = new Event<string>()
  private taskGrabEvent = new Event<string>()
  private taskDropEvent = new Event<TaskDropData>()
  private nameSubmittedEvent = new Event<string>()
  private durationSubmittedEvent = new Event<DurationSubmitData>()
  private capacitySubmittedEvent = new Event<CapacitySubmitData>()
  private modalCommandEvent = new Event<ModalCommand>()
  public readonly onAction: PublicApi<string> = this.actionEvent.publicApi()
  public readonly onTaskPressed: PublicApi<string> = this.taskPressedEvent.publicApi()
  public readonly onTaskGrab: PublicApi<string> = this.taskGrabEvent.publicApi()
  public readonly onTaskDropped: PublicApi<TaskDropData> = this.taskDropEvent.publicApi()
  public readonly onNameSubmitted: PublicApi<string> = this.nameSubmittedEvent.publicApi()
  public readonly onDurationSubmitted: PublicApi<DurationSubmitData> = this.durationSubmittedEvent.publicApi()
  public readonly onCapacitySubmitted: PublicApi<CapacitySubmitData> = this.capacitySubmittedEvent.publicApi()
  public readonly onModalCommand: PublicApi<ModalCommand> = this.modalCommandEvent.publicApi()

  private todayHost: SceneObject
  private overflowHost: SceneObject
  private capacitySlider: Slider
  private availableText: Text
  private scheduledText: Text
  private overflowDetailText: Text
  private statusDetailText: Text
  private statusBreakdownText: Text
  private lastTasks: ChronofoldTask[] = []
  private lastCapacityMinutes: number = 300
  private lastTimer: TimerViewData | null = null

  private modalRoot: SceneObject
  private modalPlate: BackPlate
  private modalTitleText: Text
  private modalMessageText: Text
  private modalValueText: Text
  private modalErrorText: Text
  private modalCancelHost: SceneObject
  private modalSecondaryHost: SceneObject
  private modalPrimaryHost: SceneObject
  private modalCancelText: Text
  private modalSecondaryText: Text
  private modalPrimaryText: Text
  private modalMode: ModalMode = "hidden"
  private modalPrimaryCommand: ModalCommand = "confirm"
  private modalSecondaryCommand: ModalCommand = "cancel"
  private keyboardText: string = ""
  private durationParts: number[] = [0, 0, 0]
  private durationFieldIndex: number = 0
  private capacityParts: number[] = [5, 0]
  private capacityFieldIndex: number = 0
  private decorativePlates: BackPlate[] = []
  private plateCleanupEvent: DelayedCallbackEvent
  private handTargets: HandDragTarget[] = []
  private activeHandDrag: ActiveHandDrag | null = null
  private activeInteractionKey: string | null = null
  private leftHand: BaseHand | null = null
  private rightHand: BaseHand | null = null
  private worldCamera: Camera | null = null
  private activeCursorDrag: ActiveCursorDrag | null = null

  onAwake(): void {
    // A Preview reset can otherwise leave the simulated Specs keyboard open
    // after its requesting script instance has been replaced.
    global.textInputSystem.dismissKeyboard()
    this.sceneObject.getTransform().setLocalScale(new vec3(this.globalScale, this.globalScale, this.globalScale))
    this.sceneObject.createComponent("Component.Canvas")
    this.buildTodayPanel()
    this.buildOverflowPanel()
    this.buildStatusPanel()
    this.buildToolbar()
    this.buildActionsPanel()
    this.buildBrand()
    this.plateCleanupEvent = this.createEvent("DelayedCallbackEvent")
    this.plateCleanupEvent.bind(() => this.disableDecorativePlateInput())
    this.plateCleanupEvent.reset(0)
    this.createEvent("UpdateEvent").bind(() => this.updateHandDrag())
    this.createEvent("OnStartEvent").bind(() => this.initializeHandTracking())
    this.createEvent("TouchStartEvent").bind((event: TouchStartEvent) => this.beginCursorDrag(event))
    this.createEvent("TouchMoveEvent").bind((event: TouchMoveEvent) => this.updateCursorDrag(event))
    this.createEvent("TouchEndEvent").bind((event: TouchEndEvent) => this.finishCursorDrag(event))
  }

  public renderSchedule(tasks: ChronofoldTask[], capacityMinutes: number, timer: TimerViewData | null = null): void {
    this.lastTasks = tasks.map((task) => ({...task}))
    this.lastCapacityMinutes = capacityMinutes
    this.lastTimer = timer ? {...timer} : null
    // Timer updates may request a render while a user is holding a card. Keep
    // the live grabbed hierarchy intact until the hand releases it.
    if (this.activeInteractionKey) return
    const today = tasks.filter((task) => task.lane === "today")
    const overflow = tasks.filter((task) => task.lane === "overflow")
    const todaySeconds = today.reduce((sum, task) => sum + taskDurationSeconds(task), 0)
    const overflowSeconds = overflow.reduce((sum, task) => sum + taskDurationSeconds(task), 0)
    const todayMinutes = todaySeconds / 60
    const overflowMinutes = overflowSeconds / 60

    this.scheduledText.text = `${this.formatDuration(todaySeconds + overflowSeconds)} scheduled`
    this.availableText.text = `${this.formatDuration(capacityMinutes * 60)} available`
    this.scheduledText.textFill.color = overflowMinutes > 0 ? this.dangerColor : this.successColor
    this.capacitySlider.currentValue = Math.min(1, todayMinutes / Math.max(1, capacityMinutes))
    this.overflowDetailText.text = overflowSeconds > 0 ? `${this.formatDuration(overflowSeconds)} over capacity` : "Everything fits today"
    if (timer) {
      this.statusDetailText.text = `FOCUS • ${timer.taskLabel.toUpperCase()}`
      this.statusDetailText.textFill.color = timer.running ? this.successColor : new vec4(1, 0.75, 0.28, 1)
      this.statusBreakdownText.text = `${this.formatClock(timer.remainingSeconds)} remaining  •  ${timer.running ? "RUNNING" : "PAUSED"}`
    } else {
      this.statusDetailText.text = todayMinutes <= capacityMinutes ? "YOUR DAY FITS" : "TODAY IS OVER CAPACITY"
      this.statusDetailText.textFill.color = todayMinutes <= capacityMinutes ? this.successColor : this.dangerColor
      this.statusBreakdownText.text = `${this.formatDuration(todaySeconds)} planned  •  ${this.formatDuration(overflowSeconds)} overflow`
    }

    this.handTargets = []
    this.clearChildren(this.todayHost)
    this.clearChildren(this.overflowHost)
    this.buildTodayTasks(today, timer)
    this.buildOverflowTasks(overflow, timer)
  }

  private buildBrand(): void {
    const brand = this.obj(this.sceneObject, "Brand", new vec3(LAYOUT.brandX, 42.0, 0))
    this.icon(brand, ICONS.view_timeline, 3.5, this.successColor, new vec3(1.75, 0, 0.12))
    const title = this.text(brand, "CHRONOFOLD", "HeadlineXL", this.primaryTextColor, 20, 3.5, new vec3(14.0, 0.8, 0.15))
    title.horizontalAlignment = HorizontalAlignment.Left
    const subtitle = this.text(brand, "Make your day physically fit.", "Caption", new vec4(0.78, 0.82, 0.86, 1), 22, 2.2, new vec3(15.0, -1.8, 0.15))
    subtitle.horizontalAlignment = HorizontalAlignment.Left
  }

  private buildActionsPanel(): void {
    const panel = this.panel("Actions Panel", new vec3(LAYOUT.actions.x, -1.0, 0), LAYOUT.actions.width, 45.0)
    const content = this.obj(panel, "Actions Content", new vec3(0, 0, 1.25))
    const layout = content.createComponent(FlexLayout.getTypeName()) as FlexLayout
    layout.autoDiscoverItemsOnStart = false
    layout.width = LAYOUT.actions.buttonWidth; layout.height = 43.0; layout.direction = FlexDirection.Column
    layout.alignItems = FlexAlign.Stretch; layout.rowGap = 0.45; layout.paddingTop = 0.8
    const actionTitle = this.flexText(content, layout, "ACTIONS", "Subheadline", this.primaryTextColor, LAYOUT.actions.buttonWidth, 4.5)
    actionTitle.horizontalAlignment = HorizontalAlignment.Center
    this.actionButton(content, layout, "add", "Add Task", "add_circle")
    this.actionButton(content, layout, "duration", "Adjust Duration", "timer")
    this.actionButton(content, layout, "timer", "Start Timer", "timer")
    this.actionButton(content, layout, "tomorrow", "Move Tomorrow", "arrow_forward")
    this.actionButton(content, layout, "reschedule", "Reschedule", "swap_horiz")
    this.actionButton(content, layout, "remove", "Remove Task", "delete")
    const actionHint = this.flexText(content, layout, "Tap an action, then a task.", "Caption", new vec4(0.72, 0.76, 0.80, 1), LAYOUT.actions.buttonWidth, 4.5)
    actionHint.horizontalAlignment = HorizontalAlignment.Center
  }

  private buildTodayPanel(): void {
    const panel = this.panel("Today Panel", new vec3(LAYOUT.today.x, 8.0, 0), LAYOUT.today.width, 52.0)
    const header = this.obj(panel, "Today Header", new vec3(-24.5, 24.5, 1.2))
    const today = this.text(header, "TODAY", "Headline1", this.primaryTextColor, 11, 5.0, new vec3(5.5, 0, 0.1))
    today.horizontalAlignment = HorizontalAlignment.Left
    const capacityHost = this.obj(header, "Edit Day Capacity", new vec3(43.0, 0, 0.1))
    const capacityButton = capacityHost.createComponent(Button.getTypeName()) as Button
    capacityButton.setVariant({theme: "SnapOS2", shape: "Capsule", style: "SecondaryNeutral"})
    capacityButton.size = new vec3(16.0, 4.5, 0.7)
    this.applyButtonPalette(capacityButton, {
      a: new vec4(0.10, 0.16, 0.20, 0.72), b: new vec4(0.04, 0.08, 0.12, 0.72),
      border: new vec4(0.31, 1.0, 0.62, 0.48), icon: this.successColor
    })
    this.availableText = this.text(capacityHost, "5h 00m available", "Caption", this.primaryTextColor, 12.5, 4.0, new vec3(-1.1, 0, 0.18))
    this.availableText.horizontalAlignment = HorizontalAlignment.Right
    this.icon(capacityHost, ICONS.edit, 1.15, this.successColor, new vec3(6.2, 0, 0.20))
    capacityButton.onTriggerUp.add(() => this.actionEvent.invoke("capacity"))

    const meter = this.obj(panel, "Capacity Meter", new vec3(-25.0, 20.0, 1.2))
    this.capacitySlider = meter.createComponent(Slider.getTypeName()) as Slider
    this.capacitySlider.size = new vec3(50.0, 2.0, 0.5)
    this.capacitySlider.currentValue = 1
    this.capacitySlider.knobSize = new vec2(1.1, 2.3)
    this.scheduledText = this.text(panel, "6h 45m scheduled", "Caption", this.dangerColor, 18, 4.0, new vec3(16.0, 16.5, 2.0))
    this.scheduledText.horizontalAlignment = HorizontalAlignment.Center

    this.todayHost = this.obj(panel, "Today Tasks", new vec3(0, 0, 1.3))
  }

  private buildOverflowPanel(): void {
    const panel = this.panel("Overflow Panel", new vec3(LAYOUT.overflow.x, 8.0, 0), LAYOUT.overflow.width, 54.0)
    const title = this.text(panel, "DOESN'T FIT", "Headline2", this.dangerColor, 18.0, 5.0, new vec3(0, 24.0, 1.2))
    title.horizontalAlignment = HorizontalAlignment.Center
    this.overflowDetailText = this.text(panel, "1h 45m over capacity", "Subheadline", this.dangerColor, 18.0, 4.5, new vec3(0, 19.5, 1.2))
    this.overflowDetailText.horizontalAlignment = HorizontalAlignment.Center
    const hint = this.text(panel, "DRAG HERE", "Caption", new vec4(1, 0.45, 0.50, 1), 15.0, 4.0, new vec3(0, 15.0, 1.2))
    hint.horizontalAlignment = HorizontalAlignment.Center
    this.overflowHost = this.obj(panel, "Overflow Tasks", new vec3(0, 0, 1.3))
    this.icon(panel, ICONS.arrow_forward, 2.4, this.dangerColor, new vec3(-12.0, -3.0, 1.45))
  }

  private buildStatusPanel(): void {
    const panel = this.panel("Status Panel", new vec3(0, -21.5, 0), LAYOUT.statusWidth, 9.5)
    this.icon(panel, ICONS.check_circle, 4.0, this.successColor, new vec3(-23.0, 0, 1.2))
    this.statusDetailText = this.text(panel, "YOUR DAY FITS", "Subheadline", this.successColor, 16.0, 4.0, new vec3(-11.5, 1.8, 1.2))
    this.statusDetailText.horizontalAlignment = HorizontalAlignment.Center
    this.statusBreakdownText = this.text(panel, "5h planned  •  1h45m to reschedule", "Caption", new vec4(0.80, 0.84, 0.88, 1), 30, 3.5, new vec3(8.0, -0.2, 1.2))
    this.statusBreakdownText.horizontalAlignment = HorizontalAlignment.Center
  }

  private buildToolbar(): void {
    const toolbar = this.panel("Gesture Toolbar", new vec3(0, -31.0, 0), LAYOUT.toolbarWidth, 7.0)
    const content = this.obj(toolbar, "Toolbar Content", new vec3(0, 0, 1.2))
    const layout = content.createComponent(FlexLayout.getTypeName()) as FlexLayout
    layout.autoDiscoverItemsOnStart = false
    layout.width = 57.0; layout.height = 5.0; layout.direction = FlexDirection.Row
    layout.columnGap = 0.8; layout.alignItems = FlexAlign.Center; layout.justifyContent = FlexJustify.Center
    this.toolbarChip(content, layout, "drag_indicator", "GRAB / MOVE")
    this.toolbarChip(content, layout, "unfold_more", "PINCH RESIZE")
    this.toolbarChip(content, layout, "refresh", "ROTATE")
    this.toolbarChip(content, layout, "my_location", "SNAP TO PLACE")
  }

  public showNamePrompt(initialText: string = ""): void {
    this.ensureWorkflowModal()
    this.layoutModal(false)
    this.modalMode = "name"
    this.keyboardText = initialText
    this.showBaseModal("ADD TASK", "What should this task be called?", initialText || "Type a task name", "")
    this.configureModalButtons("CANCEL", true, "", false, "TYPE NAME", true, "confirm", "cancel")
    this.requestKeyboard(TextInputSystem.KeyboardType.Text, TextInputSystem.ReturnKeyType.Next, initialText)
  }

  public showDurationPrompt(taskLabel: string, initialSeconds: number): void {
    this.ensureWorkflowModal()
    this.layoutModal(false)
    this.modalMode = "duration"
    const safe = Math.max(0, Math.floor(initialSeconds))
    this.durationParts = [Math.floor(safe / 3600), Math.floor((safe % 3600) / 60), safe % 60]
    this.durationFieldIndex = 0
    this.showBaseModal("SET DURATION", taskLabel, this.durationSummary(), "Enter hours, then minutes, then seconds")
    this.configureModalButtons("CANCEL", true, "", false, "ENTER HOURS", true, "confirm", "cancel")
    this.requestCurrentDurationField()
  }

  public showCapacityPrompt(initialMinutes: number): void {
    this.ensureWorkflowModal()
    this.layoutModal(false)
    this.modalMode = "capacity"
    const safe = Math.max(1, Math.min(24 * 60, Math.floor(initialMinutes)))
    this.capacityParts = [Math.floor(safe / 60), safe % 60]
    this.capacityFieldIndex = 0
    this.showBaseModal("SET DAY HOURS", "How much task time is available today?", this.capacitySummary(), "Enter hours, then minutes")
    this.configureModalButtons("CANCEL", true, "", false, "ENTER HOURS", true, "confirm", "cancel")
    this.requestCurrentCapacityField()
  }

  public showSelectionPrompt(title: string, message: string): void {
    this.ensureWorkflowModal()
    this.layoutModal(true)
    this.modalMode = "selection"
    this.showBaseModal(title, message, "", "")
    this.configureModalButtons("CANCEL", true, "", false, "", false, "confirm", "cancel")
  }

  public showConfirmation(title: string, message: string, primaryLabel: string): void {
    this.ensureWorkflowModal()
    this.layoutModal(false)
    this.modalMode = "confirm"
    this.showBaseModal(title, message, "This change is applied once.", "")
    this.configureModalButtons("CANCEL", true, "", false, primaryLabel, true, "confirm", "cancel")
  }

  public showDestinationPrompt(taskLabel: string): void {
    this.ensureWorkflowModal()
    this.layoutModal(false)
    this.modalMode = "destination"
    this.showBaseModal("RESCHEDULE", `Where should ${taskLabel} go?`, "Choose a destination", "")
    this.configureModalButtons("CANCEL", true, "TOMORROW", true, "TODAY", true, "destination_today", "destination_tomorrow")
  }

  public showTimerControls(taskLabel: string, remainingSeconds: number, running: boolean, active: boolean): void {
    this.ensureWorkflowModal()
    this.layoutModal(false)
    this.modalMode = "timer"
    const value = active ? `${this.formatClock(remainingSeconds)} remaining` : this.formatDuration(remainingSeconds)
    const message = active ? `${taskLabel} is ${running ? "running" : "paused"}.` : `Start a focus timer for ${taskLabel}?`
    this.showBaseModal("TASK TIMER", message, value, "")
    if (!active) {
      this.configureModalButtons("CLOSE", true, "", false, "START", true, "timer_start", "cancel")
    } else {
      this.configureModalButtons("CLOSE", true, "STOP", true, running ? "PAUSE" : "RESUME", true, running ? "timer_pause" : "timer_resume", "timer_stop")
    }
  }

  public showNotice(title: string, message: string): void {
    this.ensureWorkflowModal()
    this.layoutModal(false)
    this.modalMode = "notice"
    this.showBaseModal(title, message, "", "")
    this.configureModalButtons("", false, "", false, "OK", true, "cancel", "cancel")
  }

  public showTimerComplete(taskLabel: string): void {
    this.ensureWorkflowModal()
    this.layoutModal(false)
    this.modalMode = "timer_complete"
    this.showBaseModal("TIME IS UP", taskLabel, "Your planned focus time has ended.", "")
    this.configureModalButtons("", false, "", false, "DISMISS", true, "cancel", "cancel")
  }

  public hideModal(): void {
    if (this.modalRoot) this.modalRoot.enabled = false
    this.modalMode = "hidden"
    global.textInputSystem.dismissKeyboard()
  }

  public testSubmitName(value: string): boolean {
    if (this.modalMode !== "name") return false
    return this.submitName(value)
  }

  public testSubmitDuration(hours: number, minutes: number, seconds: number): boolean {
    if (this.modalMode !== "duration") return false
    this.durationParts = [hours, minutes, seconds]
    return this.submitDurationParts()
  }

  public testSubmitCapacity(hours: number, minutes: number): boolean {
    if (this.modalMode !== "capacity") return false
    this.capacityParts = [hours, minutes]
    return this.submitCapacityParts()
  }

  public testPressModal(slot: "cancel" | "secondary" | "primary"): void {
    this.handleModalButton(slot)
  }

  private ensureWorkflowModal(): void {
    if (this.modalRoot) {
      this.modalRoot.enabled = true
      return
    }
    this.modalRoot = this.panel("Workflow Modal", new vec3(0, 5.0, 4.0), 52.0, 31.0)
    this.modalPlate = this.modalRoot.getChild(0).getComponent(BackPlate.getTypeName()) as BackPlate
    this.modalTitleText = this.text(this.modalRoot, "ACTION", "Headline1", this.primaryTextColor, 45.0, 5.0, new vec3(0, 11.5, 1.5))
    this.modalMessageText = this.text(this.modalRoot, "", "Body", new vec4(0.92, 0.95, 0.98, 1), 45.0, 6.0, new vec3(0, 6.0, 1.5))
    this.modalValueText = this.text(this.modalRoot, "", "Subheadline", this.successColor, 45.0, 5.5, new vec3(0, 0.5, 1.5))
    this.modalErrorText = this.text(this.modalRoot, "", "Caption", this.dangerColor, 45.0, 4.0, new vec3(0, -4.0, 1.5))

    const cancel = this.workflowButton(this.modalRoot, "Modal Cancel", -16.0)
    this.modalCancelHost = cancel.host; this.modalCancelText = cancel.label
    const secondary = this.workflowButton(this.modalRoot, "Modal Secondary", 0)
    this.modalSecondaryHost = secondary.host; this.modalSecondaryText = secondary.label
    const primary = this.workflowButton(this.modalRoot, "Modal Primary", 16.0)
    this.modalPrimaryHost = primary.host; this.modalPrimaryText = primary.label
    cancel.button.onTriggerUp.add(() => this.handleModalButton("cancel"))
    secondary.button.onTriggerUp.add(() => this.handleModalButton("secondary"))
    primary.button.onTriggerUp.add(() => this.handleModalButton("primary"))
    this.plateCleanupEvent.reset(0)
  }

  private layoutModal(compactSelection: boolean): void {
    if (compactSelection) {
      // Selection guidance temporarily occupies the status strip, keeping the
      // entire task grid unobstructed and preserving the brand/header above.
      this.modalRoot.getTransform().setLocalPosition(new vec3(0, -25.0, 4.0))
      this.modalPlate.size = new vec2(52.0, 12.0)
      this.modalTitleText.getSceneObject().getTransform().setLocalPosition(new vec3(0, 3.0, 1.5))
      this.modalMessageText.getSceneObject().getTransform().setLocalPosition(new vec3(0, -0.8, 1.5))
      this.modalValueText.getSceneObject().enabled = false
      this.modalErrorText.getSceneObject().enabled = false
      this.modalCancelHost.getTransform().setLocalPosition(new vec3(0, -4.5, 1.5))
      return
    }
    this.modalRoot.getTransform().setLocalPosition(new vec3(0, 5.0, 4.0))
    this.modalPlate.size = new vec2(52.0, 31.0)
    this.modalTitleText.getSceneObject().getTransform().setLocalPosition(new vec3(0, 11.5, 1.5))
    this.modalMessageText.getSceneObject().getTransform().setLocalPosition(new vec3(0, 6.0, 1.5))
    this.modalValueText.getSceneObject().enabled = true
    this.modalErrorText.getSceneObject().enabled = true
    this.modalValueText.getSceneObject().getTransform().setLocalPosition(new vec3(0, 0.5, 1.5))
    this.modalErrorText.getSceneObject().getTransform().setLocalPosition(new vec3(0, -4.0, 1.5))
    this.modalCancelHost.getTransform().setLocalPosition(new vec3(-16.0, -11.5, 1.5))
    this.modalSecondaryHost.getTransform().setLocalPosition(new vec3(0, -11.5, 1.5))
    this.modalPrimaryHost.getTransform().setLocalPosition(new vec3(16.0, -11.5, 1.5))
  }

  private workflowButton(parent: SceneObject, name: string, x: number): {host: SceneObject; button: Button; label: Text} {
    const host = this.obj(parent, name, new vec3(x, -11.5, 1.5))
    const face = this.obj(host, `${name} Face`)
    const button = face.createComponent(Button.getTypeName()) as Button
    button.setVariant({theme: "SnapOS2", shape: "Capsule", style: "SecondaryNeutral"})
    button.size = new vec3(14.5, 5.4, 0.8)
    this.applyButtonPalette(button, {
      a: new vec4(0.14, 0.18, 0.24, 0.98), b: new vec4(0.05, 0.07, 0.11, 0.98),
      border: new vec4(0.45, 0.95, 0.72, 0.72), icon: this.successColor
    })
    const label = this.text(host, "BUTTON", "Button", this.primaryTextColor, 13.5, 4.0, new vec3(0, 0, 0.18))
    return {host, button, label}
  }

  private showBaseModal(title: string, message: string, value: string, error: string): void {
    this.modalRoot.enabled = true
    this.modalTitleText.text = title
    this.modalMessageText.text = message
    this.modalValueText.text = value
    this.modalErrorText.text = error
  }

  private configureModalButtons(cancelLabel: string, showCancel: boolean, secondaryLabel: string, showSecondary: boolean, primaryLabel: string, showPrimary: boolean, primaryCommand: ModalCommand, secondaryCommand: ModalCommand): void {
    this.modalCancelHost.enabled = showCancel
    this.modalSecondaryHost.enabled = showSecondary
    this.modalPrimaryHost.enabled = showPrimary
    this.modalCancelText.text = cancelLabel
    this.modalSecondaryText.text = secondaryLabel
    this.modalPrimaryText.text = primaryLabel
    this.modalPrimaryCommand = primaryCommand
    this.modalSecondaryCommand = secondaryCommand
  }

  private handleModalButton(slot: "cancel" | "secondary" | "primary"): void {
    if (slot === "cancel") {
      this.hideModal()
      this.modalCommandEvent.invoke("cancel")
      return
    }
    if (slot === "primary" && this.modalMode === "name") {
      this.requestKeyboard(TextInputSystem.KeyboardType.Text, TextInputSystem.ReturnKeyType.Next, this.keyboardText)
      return
    }
    if (slot === "primary" && this.modalMode === "duration") {
      this.requestCurrentDurationField()
      return
    }
    if (slot === "primary" && this.modalMode === "capacity") {
      this.requestCurrentCapacityField()
      return
    }
    const command = slot === "primary" ? this.modalPrimaryCommand : this.modalSecondaryCommand
    this.hideModal()
    this.modalCommandEvent.invoke(command)
  }

  private requestCurrentDurationField(): void {
    const labels = ["HOURS", "MINUTES", "SECONDS"]
    const returnTypes = [TextInputSystem.ReturnKeyType.Next, TextInputSystem.ReturnKeyType.Next, TextInputSystem.ReturnKeyType.Done]
    this.modalPrimaryText.text = `ENTER ${labels[this.durationFieldIndex]}`
    this.modalErrorText.text = `Enter ${labels[this.durationFieldIndex].toLowerCase()} (${this.durationFieldIndex === 0 ? "0–99" : "0–59"})`
    this.requestKeyboard(TextInputSystem.KeyboardType.Num, returnTypes[this.durationFieldIndex], String(this.durationParts[this.durationFieldIndex]))
  }

  private requestCurrentCapacityField(): void {
    const labels = ["HOURS", "MINUTES"]
    const returnTypes = [TextInputSystem.ReturnKeyType.Next, TextInputSystem.ReturnKeyType.Done]
    this.modalPrimaryText.text = `ENTER ${labels[this.capacityFieldIndex]}`
    this.modalErrorText.text = this.capacityFieldIndex === 0 ? "Enter hours (0–24)" : "Enter minutes (0–59)"
    this.requestKeyboard(TextInputSystem.KeyboardType.Num, returnTypes[this.capacityFieldIndex], String(this.capacityParts[this.capacityFieldIndex]))
  }

  private requestKeyboard(type: TextInputSystem.KeyboardType, returnType: TextInputSystem.ReturnKeyType, initialText: string): void {
    require("LensStudio:TextInputModule")
    this.keyboardText = initialText
    const options = new TextInputSystem.KeyboardOptions()
    options.enablePreview = true
    options.keyboardType = type
    options.returnKeyType = returnType
    options.initialText = initialText
    options.initialSelectedRange = new vec2(0, initialText.length)
    options.onTextChanged = (textValue: string) => {
      this.keyboardText = textValue
      if (this.modalMode === "name") this.modalValueText.text = textValue || "Type a task name"
    }
    options.onReturnKeyPressed = () => this.submitKeyboardValue()
    options.onError = (error: number, description: string) => {
      this.modalErrorText.text = `Keyboard ${error}: ${description}`
      console.error(`[Chronofold] keyboard ${error}: ${description}`)
    }
    global.textInputSystem.requestKeyboard(options)
  }

  private submitKeyboardValue(): void {
    if (this.modalMode === "name") {
      this.submitName(this.keyboardText)
      return
    }
    if (this.modalMode === "capacity") {
      this.submitCapacityKeyboardValue()
      return
    }
    if (this.modalMode !== "duration") return
    const parsed = Number(this.keyboardText.trim())
    const max = this.durationFieldIndex === 0 ? 99 : 59
    if (!Number.isFinite(parsed) || Math.floor(parsed) !== parsed || parsed < 0 || parsed > max) {
      this.modalErrorText.text = `Use a whole number from 0 to ${max}.`
      return
    }
    this.durationParts[this.durationFieldIndex] = parsed
    this.modalValueText.text = this.durationSummary()
    if (this.durationFieldIndex < 2) {
      this.durationFieldIndex += 1
      this.requestCurrentDurationField()
    } else {
      this.submitDurationParts()
    }
  }

  private submitName(value: string): boolean {
    const trimmed = value.trim()
    if (trimmed.length < 1 || trimmed.length > 48) {
      this.modalErrorText.text = "Enter a task name between 1 and 48 characters."
      return false
    }
    global.textInputSystem.dismissKeyboard()
    this.modalRoot.enabled = false
    this.modalMode = "hidden"
    this.nameSubmittedEvent.invoke(trimmed)
    return true
  }

  private submitDurationParts(): boolean {
    const h = Math.floor(this.durationParts[0])
    const m = Math.floor(this.durationParts[1])
    const s = Math.floor(this.durationParts[2])
    if (h < 0 || h > 99 || m < 0 || m > 59 || s < 0 || s > 59) {
      this.modalErrorText.text = "Hours must be 0–99; minutes and seconds 0–59."
      return false
    }
    const totalSeconds = h * 3600 + m * 60 + s
    if (totalSeconds <= 0) {
      this.modalErrorText.text = "Duration must be greater than zero."
      return false
    }
    global.textInputSystem.dismissKeyboard()
    this.modalRoot.enabled = false
    this.modalMode = "hidden"
    this.durationSubmittedEvent.invoke({hours: h, minutes: m, seconds: s, totalSeconds})
    return true
  }

  private submitCapacityKeyboardValue(): void {
    const parsed = Number(this.keyboardText.trim())
    const max = this.capacityFieldIndex === 0 ? 24 : 59
    if (!Number.isFinite(parsed) || Math.floor(parsed) !== parsed || parsed < 0 || parsed > max) {
      this.modalErrorText.text = `Use a whole number from 0 to ${max}.`
      return
    }
    this.capacityParts[this.capacityFieldIndex] = parsed
    this.modalValueText.text = this.capacitySummary()
    if (this.capacityFieldIndex === 0) {
      this.capacityFieldIndex = 1
      this.requestCurrentCapacityField()
    } else {
      this.submitCapacityParts()
    }
  }

  private submitCapacityParts(): boolean {
    const h = Math.floor(this.capacityParts[0])
    const m = Math.floor(this.capacityParts[1])
    if (h < 0 || h > 24 || m < 0 || m > 59) {
      this.modalErrorText.text = "Hours must be 0–24 and minutes 0–59."
      return false
    }
    const totalMinutes = h * 60 + m
    if (totalMinutes <= 0 || totalMinutes > 24 * 60) {
      this.modalErrorText.text = "Available time must be between 1 minute and 24 hours."
      return false
    }
    global.textInputSystem.dismissKeyboard()
    this.modalRoot.enabled = false
    this.modalMode = "hidden"
    this.capacitySubmittedEvent.invoke({hours: h, minutes: m, totalMinutes})
    return true
  }

  private durationSummary(): string {
    return `${this.pad2(this.durationParts[0])}h  ${this.pad2(this.durationParts[1])}m  ${this.pad2(this.durationParts[2])}s`
  }

  private capacitySummary(): string {
    return `${this.pad2(this.capacityParts[0])}h  ${this.pad2(this.capacityParts[1])}m available`
  }

  private buildTodayTasks(tasks: ChronofoldTask[], timer: TimerViewData | null): void {
    let i = 0
    let cursorY = 13.5
    while (i < tasks.length) {
      const first = tasks[i]
      if (first.halfWidth && i + 1 < tasks.length && tasks[i + 1].halfWidth) {
        const h = 8.0
        const y = cursorY - h * 0.5
        this.taskCard(this.todayHost, first, LAYOUT.today.halfWidth, h, new vec3(-12.75, y, 0), timer)
        this.taskCard(this.todayHost, tasks[i + 1], LAYOUT.today.halfWidth, h, new vec3(12.75, y, 0), timer)
        cursorY -= h + 1.0
        i += 2
      } else {
        const h = taskDurationSeconds(first) >= 5400 ? 11.0 : 8.0
        const y = cursorY - h * 0.5
        this.taskCard(this.todayHost, first, LAYOUT.today.innerWidth, h, new vec3(0, y, 0), timer)
        cursorY -= h + 1.0
        i += 1
      }
    }
  }

  private buildOverflowTasks(tasks: ChronofoldTask[], timer: TimerViewData | null): void {
    let cursorY = 11.0
    for (const task of tasks) {
      const h = 11.0
      this.taskCard(this.overflowHost, task, LAYOUT.overflow.cardWidth, h, new vec3(0, cursorY - h * 0.5, 0), timer)
      cursorY -= h + 1.5
    }
  }

  private taskCard(parent: SceneObject, task: ChronofoldTask, width: number, height: number, position: vec3, timer: TimerViewData | null): void {
    const card = this.obj(parent, `Task ${task.key}`, position)
    const face = this.obj(card, "Task Face", new vec3(0, 0, 0))
    const palette = PALETTES[task.palette % PALETTES.length]
    // A task needs a visual surface, but it must not create a second hidden
    // Interactable. Mouse and index-thumb input are both owned by the unified
    // adapters below, so a pure UIKit visual avoids stale cursor targets when
    // the schedule reflows after a drop.
    const surface = new RoundedRectangleVisual({sceneObject: face, transparent: true})
    surface.size = new vec3(width, height, 0.8)
    surface.defaultBaseType = "Gradient"
    surface.defaultGradient = this.gradient(palette.a, palette.b)
    surface.defaultHasBorder = true
    surface.defaultBorderSize = 0.07
    surface.defaultBorderType = "Color"
    surface.borderDefaultColor = palette.border
    surface.renderMeshVisual.mainPass.depthTest = false
    surface.renderMeshVisual.mainPass.depthWrite = false
    const compact = width < 10
    const iconSize = compact ? 1.4 : 2.0
    const handleX = width * 0.5 - (compact ? 4.0 : 1.8)
    const dragFace = this.obj(card, "Drag Handle", new vec3(handleX, 0, 0.60))
    this.icon(card, ICONS[task.icon] ?? ICONS.timer, iconSize, palette.icon, new vec3(handleX, -0.15, 0.24))
    const labelWidth = width - 4.2
    const label = this.text(card, task.label, "Button", this.primaryTextColor, labelWidth, 2.3, new vec3(-0.9, height * 0.18, 0.18))
    label.horizontalAlignment = HorizontalAlignment.Left
    const isTimed = timer?.taskKey === task.key
    const durationLabel = isTimed ? `${this.formatClock(timer.remainingSeconds)} ${timer.running ? "▶" : "Ⅱ"}` : this.formatDuration(taskDurationSeconds(task))
    const duration = this.text(card, durationLabel, "Caption", isTimed ? this.successColor : new vec4(0.88, 0.91, 0.95, 1), labelWidth, 2.0, new vec3(-0.9, -height * 0.25, 0.18))
    duration.horizontalAlignment = HorizontalAlignment.Left

    const handTarget: HandDragTarget = {
      key: task.key,
      label: task.label,
      card,
      handle: dragFace,
      width,
      height
    }
    this.handTargets.push(handTarget)
  }

  private initializeHandTracking(): void {
    this.worldCamera = WorldCameraFinderProvider.getInstance().getComponent()
    const provider = HandInputData.getInstance()
    this.leftHand = provider.getHand("left")
    this.rightHand = provider.getHand("right")
    this.bindHand(this.leftHand, "left")
    this.bindHand(this.rightHand, "right")
    print("[Chronofold] HAND TRACKING ready for left/right index-thumb pinch")
  }

  private bindHand(hand: BaseHand, handType: HandKind): void {
    hand.onPinchDown.add(() => this.beginHandDrag(hand, handType))
    hand.onPinchUp.add(() => this.finishHandDrag(false))
    hand.onPinchCancel.add(() => this.finishHandDrag(true))
    hand.onHandLost.add(() => {
      if (this.activeHandDrag?.handType === handType) this.finishHandDrag(true)
    })
  }

  private beginHandDrag(hand: BaseHand, handType: HandKind): void {
    if (this.activeInteractionKey || !hand.isTracked()) return
    const pinch = this.pinchCenter(hand)
    let nearest: HandDragTarget | null = null
    // The physical pinch locus sits between index and thumb while SIK's
    // targeting point is index-led. A generous nearest-card radius keeps the
    // gesture comfortable without ambiguity because only the closest card is
    // selected.
    let nearestDistance = 14.0
    let closestDistance = Number.POSITIVE_INFINITY
    let closestLabel = "none"
    let closestPosition = vec3.zero()
    for (const target of this.handTargets) {
      if (!target.card || isNull(target.card) || !target.handle || isNull(target.handle)) continue
      const handlePosition = target.handle.getTransform().getWorldPosition()
      const distance = handlePosition.distance(pinch)
      if (distance < closestDistance) {
        closestDistance = distance
        closestLabel = target.label
        closestPosition = handlePosition
      }
      if (distance < nearestDistance) {
        nearest = target
        nearestDistance = distance
      }
    }
    if (!nearest) {
      print(
        `[Chronofold] HAND PINCH ${handType} no task; ` +
        `locus=(${pinch.x.toFixed(1)},${pinch.y.toFixed(1)},${pinch.z.toFixed(1)}) ` +
        `nearest=${closestLabel}@(${closestPosition.x.toFixed(1)},${closestPosition.y.toFixed(1)},${closestPosition.z.toFixed(1)}) ` +
        `distance=${closestDistance.toFixed(1)}cm`
      )
      return
    }
    this.activeInteractionKey = nearest.key
    this.activeHandDrag = {
      handType,
      hand,
      target: nearest,
      startPinch: pinch,
      startCard: nearest.card.getTransform().getWorldPosition(),
      moved: false,
      originalStatus: this.statusDetailText.text,
      originalBreakdown: this.statusBreakdownText.text,
      originalStatusColor: this.statusDetailText.textFill.color
    }
    this.statusDetailText.text = `${handType.toUpperCase()} HAND • INDEX + THUMB`
    this.statusDetailText.textFill.color = this.successColor
    this.statusBreakdownText.text = `Pinching ${nearest.label}  •  move and release over a lane`
    this.taskGrabEvent.invoke(nearest.key)
    print(`[Chronofold] HAND GRAB ${handType} ${nearest.label}`)
  }

  private updateHandDrag(): void {
    const active = this.activeHandDrag
    if (!active) return
    if (!active.hand.isTracked()) {
      this.finishHandDrag(true)
      return
    }
    const pinch = this.pinchCenter(active.hand)
    const delta = pinch.sub(active.startPinch)
    if (delta.length > 1.2) active.moved = true
    const next = new vec3(active.startCard.x + delta.x, active.startCard.y + delta.y, active.startCard.z)
    active.target.card.getTransform().setWorldPosition(next)
    const destination = this.dropDestination(next.x)
    this.statusDetailText.text = `${active.handType.toUpperCase()} HAND • ${destination === "overflow" ? "DOESN'T FIT" : "TODAY"}`
    this.statusDetailText.textFill.color = destination === "overflow" ? this.dangerColor : this.successColor
    this.statusBreakdownText.text = `Release to place ${active.target.label}`
  }

  private finishHandDrag(cancelled: boolean): void {
    const active = this.activeHandDrag
    if (!active) return
    const cardPosition = active.target.card.getTransform().getWorldPosition()
    const shouldDrop = !cancelled && active.moved
    this.activeHandDrag = null
    this.activeInteractionKey = null
    if (shouldDrop) {
      const destination = this.dropDestination(cardPosition.x)
      print(`[Chronofold] HAND RELEASE ${active.handType} ${active.target.label} -> ${destination}`)
      this.taskDropEvent.invoke({
        key: active.target.key,
        destination,
        worldX: cardPosition.x,
        hand: active.handType
      })
      return
    }
    active.target.card.getTransform().setWorldPosition(active.startCard)
    this.statusDetailText.text = active.originalStatus
    this.statusDetailText.textFill.color = active.originalStatusColor
    this.statusBreakdownText.text = active.originalBreakdown
    if (!cancelled) this.taskPressedEvent.invoke(active.target.key)
  }

  private pinchCenter(hand: BaseHand): vec3 {
    const index = hand.indexTip.position
    const thumb = hand.thumbTip.position
    return new vec3((index.x + thumb.x) * 0.5, (index.y + thumb.y) * 0.5, (index.z + thumb.z) * 0.5)
  }

  private beginCursorDrag(event: TouchStartEvent): void {
    if (!global.deviceInfoSystem.isEditor() || this.activeInteractionKey || !this.worldCamera) return
    const touch = event.getTouchPosition()
    print(`[Chronofold] CURSOR DOWN (${touch.x.toFixed(3)},${touch.y.toFixed(3)})`)
    const target = this.cursorTargetAt(touch)
    if (!target) {
      print("[Chronofold] CURSOR DOWN no task under pointer")
      return
    }
    const cardPosition = target.card.getTransform().getWorldPosition()
    const cameraPosition = this.worldCamera.getTransform().getWorldPosition()
    // Camera.screenSpaceToWorldSpace expects a positive absolute depth. Using
    // Euclidean camera distance is robust across Lens Transform.forward sign
    // conventions and keeps the dragged card on its authored plane.
    const depth = cardPosition.distance(cameraPosition)

    this.activeInteractionKey = target.key
    this.activeCursorDrag = {
      touchId: event.getTouchId(),
      target,
      depth,
      startPointer: this.worldCamera.screenSpaceToWorldSpace(touch, depth),
      startCard: cardPosition,
      moved: false,
      originalStatus: this.statusDetailText.text,
      originalBreakdown: this.statusBreakdownText.text,
      originalStatusColor: this.statusDetailText.textFill.color
    }
    this.statusDetailText.text = "CURSOR • DRAG TASK"
    this.statusDetailText.textFill.color = this.successColor
    this.statusBreakdownText.text = `Dragging ${target.label}  •  release over a lane`
    this.taskGrabEvent.invoke(target.key)
    print(`[Chronofold] CURSOR GRAB ${target.label}`)
  }

  private updateCursorDrag(event: TouchMoveEvent): void {
    const active = this.activeCursorDrag
    if (!active || !this.worldCamera || event.getTouchId() !== active.touchId) return
    const pointer = this.worldCamera.screenSpaceToWorldSpace(event.getTouchPosition(), active.depth)
    const delta = pointer.sub(active.startPointer)
    if (delta.length > 1.2) active.moved = true
    const next = new vec3(active.startCard.x + delta.x, active.startCard.y + delta.y, active.startCard.z)
    active.target.card.getTransform().setWorldPosition(next)
    const destination = this.dropDestination(next.x)
    this.statusDetailText.text = `CURSOR • ${destination === "overflow" ? "DOESN'T FIT" : "TODAY"}`
    this.statusDetailText.textFill.color = destination === "overflow" ? this.dangerColor : this.successColor
    this.statusBreakdownText.text = `Release to place ${active.target.label}`
  }

  private finishCursorDrag(event: TouchEndEvent): void {
    const active = this.activeCursorDrag
    if (!active || event.getTouchId() !== active.touchId) return
    const cardPosition = active.target.card.getTransform().getWorldPosition()
    const shouldDrop = !event.isCancelled() && active.moved
    this.activeCursorDrag = null
    this.activeInteractionKey = null
    if (shouldDrop) {
      const destination = this.dropDestination(cardPosition.x)
      print(`[Chronofold] CURSOR RELEASE ${active.target.label} -> ${destination}`)
      this.taskDropEvent.invoke({
        key: active.target.key,
        destination,
        worldX: cardPosition.x,
        hand: "preview"
      })
      return
    }
    active.target.card.getTransform().setWorldPosition(active.startCard)
    this.statusDetailText.text = active.originalStatus
    this.statusDetailText.textFill.color = active.originalStatusColor
    this.statusBreakdownText.text = active.originalBreakdown
    if (!event.isCancelled()) this.taskPressedEvent.invoke(active.target.key)
  }

  private cursorTargetAt(screenPosition: vec2): HandDragTarget | null {
    if (!this.worldCamera) return null
    let nearest: HandDragTarget | null = null
    let nearestDistance = Number.POSITIVE_INFINITY
    for (const target of this.handTargets) {
      if (!target.card || isNull(target.card)) continue
      const transform = target.card.getTransform()
      const center = transform.getWorldPosition()
      const scale = transform.getWorldScale()
      const horizontal = transform.right.uniformScale(target.width * scale.x * 0.5)
      const vertical = transform.up.uniformScale(target.height * scale.y * 0.5)
      const a = this.worldCamera.worldSpaceToScreenSpace(center.sub(horizontal).add(vertical))
      const b = this.worldCamera.worldSpaceToScreenSpace(center.add(horizontal).sub(vertical))
      const minX = Math.min(a.x, b.x) - 0.004
      const maxX = Math.max(a.x, b.x) + 0.004
      const minY = Math.min(a.y, b.y) - 0.004
      const maxY = Math.max(a.y, b.y) + 0.004
      if (screenPosition.x < minX || screenPosition.x > maxX || screenPosition.y < minY || screenPosition.y > maxY) continue
      const projectedCenter = this.worldCamera.worldSpaceToScreenSpace(center)
      const distance = projectedCenter.distance(screenPosition)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearest = target
      }
    }
    return nearest
  }

  private dropDestination(worldX: number): ChronofoldLane {
    const todayX = this.todayHost.getTransform().getWorldPosition().x
    const overflowX = this.overflowHost.getTransform().getWorldPosition().x
    return Math.abs(worldX - overflowX) < Math.abs(worldX - todayX) ? "overflow" : "today"
  }

  private actionButton(parent: SceneObject, layout: FlexLayout, key: string, label: string, iconName: string): void {
    const host = this.obj(parent, `Action ${label}`)
    const item = host.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = LAYOUT.actions.buttonWidth; item.overrideHeight = 4.5; item.flexShrink = 0
    const face = this.obj(host, "Action Face", new vec3(0, 0, 0))
    const button = face.createComponent(Button.getTypeName()) as Button
    button.setVariant({theme: "SnapOS2", shape: "Rectangle", style: "SecondaryNeutral"})
    button.size = new vec3(LAYOUT.actions.buttonWidth, 4.5, 0.7)
    this.applyButtonPalette(button, {
      a: new vec4(0.12, 0.15, 0.19, this.panelOpacity), b: new vec4(0.055, 0.07, 0.10, this.panelOpacity),
      border: new vec4(0.35, 0.42, 0.50, 0.45), icon: this.successColor
    })
    this.icon(host, ICONS[iconName], 1.45, this.primaryTextColor, new vec3(-8.0, 0, 0.18))
    const t = this.text(host, label, "Caption", this.primaryTextColor, 13.5, 4.0, new vec3(1.5, 0, 0.18))
    t.horizontalAlignment = HorizontalAlignment.Left
    button.onTriggerUp.add(() => this.actionEvent.invoke(key))
    layout.addItems([item])
  }

  private toolbarChip(parent: SceneObject, layout: FlexLayout, iconName: string, label: string): void {
    const host = this.obj(parent, `Tool ${label}`)
    const item = host.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = LAYOUT.toolbarChipWidth; item.overrideHeight = 4.6; item.flexShrink = 0
    const face = this.obj(host, "Toolbar Face", new vec3(0, 0, 0))
    const button = face.createComponent(Button.getTypeName()) as Button
    button.setVariant({theme: "SnapOS2", shape: "Capsule", style: "SecondaryNeutral"})
    button.size = new vec3(LAYOUT.toolbarChipWidth, 4.6, 0.6)
    button.onInitialized.add(() => {
      const visual = button.visual as RoundedRectangleVisual
      if (!visual) return
      visual.renderMeshVisual.mainPass.depthTest = false
      visual.renderMeshVisual.mainPass.depthWrite = false
    })
    this.icon(host, ICONS[iconName], 1.35, new vec4(0.88, 0.91, 0.94, 1), new vec3(-5.6, 0, 0.16))
    const t = this.text(host, label, "Caption", new vec4(0.88, 0.91, 0.94, 1), 10.0, 3.6, new vec3(1.0, 0, 0.16))
    t.horizontalAlignment = HorizontalAlignment.Left
    layout.addItems([item])
  }

  private panel(name: string, position: vec3, width: number, height: number): SceneObject {
    const panel = this.obj(this.sceneObject, name, position)
    const plateHost = this.obj(panel, `${name} BackPlate`, new vec3(0, 0, 0))
    const plate = plateHost.createComponent(BackPlate.getTypeName()) as BackPlate
    this.decorativePlates.push(plate)
    plate.size = new vec2(width, height)
    plate.style = "default"
    plate.onInitialized.add(() => {
      const internals = plate as unknown as {
        roundedRectangle?: {renderMeshVisual?: RenderMeshVisual}
      }
      const visual = internals.roundedRectangle?.renderMeshVisual
      if (!visual) return
      visual.mainPass.depthTest = false
      visual.mainPass.depthWrite = false
    })
    // These plates are visual surfaces, not input targets. Leaving their
    // full-size interaction planes enabled blocks the buttons/cards layered
    // directly in front of them in both Preview and on-device hand rays.
    return panel
  }

  private disableDecorativePlateInput(): void {
    for (const plate of this.decorativePlates) {
      if (!plate) continue
      if (plate.interactable) plate.interactable.enabled = false
      const decorativeCollider = (plate as unknown as {collider?: ColliderComponent}).collider
      if (decorativeCollider) decorativeCollider.enabled = false
      if (!plate.interactionPlane || isNull(plate.interactionPlane)) continue
      plate.interactionPlane.enabled = false
      const interactionCollider = plate.interactionPlane.collider
      if (!interactionCollider || isNull(interactionCollider)) continue
      const colliderObject = interactionCollider.getSceneObject()
      if (colliderObject && !isNull(colliderObject)) colliderObject.destroy()
    }
  }

  private flexText(parent: SceneObject, layout: FlexLayout, value: string, role: TextRole, color: vec4, width: number, height: number): Text {
    const host = this.obj(parent, `Text ${value}`)
    const item = host.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = width; item.overrideHeight = height; item.flexShrink = 0
    const t = this.text(host, value, role, color, width, height, new vec3(0, 0, 0.1))
    t.horizontalAlignment = HorizontalAlignment.Left
    layout.addItems([item])
    return t
  }

  private applyButtonPalette(button: Button, palette: Palette): void {
    const apply = () => {
      const visual = button.visual as RoundedRectangleVisual
      if (!visual) return
      visual.renderMeshVisual.mainPass.depthTest = false
      visual.renderMeshVisual.mainPass.depthWrite = false
      const normal = this.gradient(palette.a, palette.b)
      const hover = this.gradient(
        new vec4(Math.min(1, palette.a.x + 0.12), Math.min(1, palette.a.y + 0.12), Math.min(1, palette.a.z + 0.12), palette.a.w),
        new vec4(Math.min(1, palette.b.x + 0.08), Math.min(1, palette.b.y + 0.08), Math.min(1, palette.b.z + 0.08), palette.b.w)
      )
      visual.defaultBaseType = "Gradient"; visual.hoveredBaseType = "Gradient"; visual.triggeredBaseType = "Gradient"
      visual.defaultGradient = normal; visual.hoveredGradient = hover; visual.triggeredGradient = hover
      visual.defaultHasBorder = true; visual.hoveredHasBorder = true; visual.triggeredHasBorder = true
      visual.defaultBorderSize = 0.07; visual.hoveredBorderSize = 0.10; visual.triggeredBorderSize = 0.12
      visual.defaultBorderType = "Color"; visual.hoveredBorderType = "Color"; visual.triggeredBorderType = "Color"
      visual.borderDefaultColor = palette.border; visual.borderHoveredColor = new vec4(palette.border.x, palette.border.y, palette.border.z, 1)
      visual.borderTriggeredColor = new vec4(1, 1, 1, 0.9)
    }
    if (button.initialized) apply()
    else button.onInitialized.add(apply)
  }

  private gradient(a: vec4, b: vec4): GradientParameters {
    return {
      enabled: true, type: "Linear", start: new vec2(-1, 1), end: new vec2(1, -1),
      stop0: {enabled: true, percent: 0, color: a}, stop1: {enabled: true, percent: 0.35, color: a},
      stop2: {enabled: true, percent: 0.72, color: b}, stop3: {enabled: true, percent: 1, color: b}
    }
  }

  private text(parent: SceneObject, value: string, role: TextRole, color: vec4, width: number, height: number, position: vec3): Text {
    const host = this.obj(parent, `Label ${value}`, position)
    const t = host.createComponent("Component.Text") as Text
    t.text = value; t.font = THEME_FONT; t.depthTest = false; t.textFill.color = color
    t.horizontalAlignment = HorizontalAlignment.Center; t.verticalAlignment = VerticalAlignment.Center
    t.horizontalOverflow = HorizontalOverflow.Shrink; t.verticalOverflow = VerticalOverflow.Shrink
    t.layoutRect = Rect.create(-width * 0.5, width * 0.5, -height * 0.5, height * 0.5)
    applyTextRole(t, role)
    return t
  }

  private icon(parent: SceneObject, texture: Texture, size: number, tint: vec4, position: vec3): Image {
    const host = this.obj(parent, "Icon", position)
    host.getTransform().setLocalScale(new vec3(size * ICON_SIZE_SCALE, size * ICON_SIZE_SCALE, 1))
    const image = host.createComponent("Component.Image") as Image
    const material = IMAGE_MATERIAL.clone()
    material.mainPass.baseTex = texture; material.mainPass.baseColor = tint
    material.mainPass.depthTest = false; material.mainPass.depthWrite = false
    image.clearMaterials(); image.addMaterial(material)
    return image
  }

  private clearChildren(parent: SceneObject): void {
    const children: SceneObject[] = []
    for (let i = 0; i < parent.getChildrenCount(); i++) children.push(parent.getChild(i))
    for (const child of children) child.destroy()
  }

  private formatDuration(totalSeconds: number): string {
    const safe = Math.max(0, Math.round(totalSeconds))
    const hours = Math.floor(safe / 3600)
    const minutes = Math.floor((safe % 3600) / 60)
    const seconds = safe % 60
    const parts: string[] = []
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0 || hours > 0) parts.push(`${this.pad2(minutes)}m`)
    if (seconds > 0 || parts.length === 0) parts.push(`${this.pad2(seconds)}s`)
    return parts.join(" ")
  }

  private formatClock(totalSeconds: number): string {
    const safe = Math.max(0, Math.ceil(totalSeconds))
    const hours = Math.floor(safe / 3600)
    const minutes = Math.floor((safe % 3600) / 60)
    const seconds = safe % 60
    return hours > 0
      ? `${this.pad2(hours)}:${this.pad2(minutes)}:${this.pad2(seconds)}`
      : `${this.pad2(minutes)}:${this.pad2(seconds)}`
  }

  private pad2(value: number): string {
    const safe = Math.max(0, Math.floor(value))
    return safe < 10 ? `0${safe}` : String(safe)
  }

  private obj(parent: SceneObject, name: string, position?: vec3): SceneObject {
    const sceneObject = global.scene.createSceneObject(name)
    sceneObject.setParent(parent)
    if (position) sceneObject.getTransform().setLocalPosition(position)
    return sceneObject
  }
}
