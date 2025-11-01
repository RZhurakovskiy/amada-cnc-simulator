import {
	AlertTriangle,
	BarChart3,
	Calendar,
	CheckCircle,
	ChevronDown,
	Circle,
	Clock,
	Code,
	Download,
	Eye,
	FileText,
	Grid3X3,
	Info,
	Maximize2,
	Minimize2,
	Pause,
	Percent,
	Play,
	RotateCcw,
	Ruler,
	Settings,
	Wrench,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// CodeMirror imports
import { defaultKeymap } from '@codemirror/commands'
import {
	HighlightStyle,
	StreamLanguage,
	syntaxHighlighting,
} from '@codemirror/language'
import { Compartment, EditorState } from '@codemirror/state'
import {
	EditorView,
	highlightActiveLineGutter,
	keymap,
	lineNumbers,
} from '@codemirror/view'
import { tags } from '@lezer/highlight'

// G-code syntax
const gcodeConfig = {
	token: stream => {
		if (stream.match(/^[GM]\d+/)) return 'keyword'
		if (stream.match(/^T\d+/)) return 'tool'
		if (stream.match(/^[XYZDIJFRO]/)) {
			stream.match(/[\d.\-+eE]+/)
			return 'number'
		}
		if (stream.match(/^\s*\(.+\)/)) return 'comment'
		if (stream.match(/^[O]/)) return 'def'
		stream.next()
		return null
	},
}

const gcodeHighlight = HighlightStyle.define([
	{ tag: tags.keyword, color: '#d73a49', fontWeight: 'bold' },
	{ tag: tags.number, color: '#005cc5' },
	{ tag: tags.comment, color: '#6a737d', fontStyle: 'italic' },
	{ tag: tags.definition, color: '#22863a', fontWeight: 'bold' },
	{ tag: tags.variableName, color: '#b11a99', fontWeight: 'bold' },
])

const App = () => {
	const canvasRef = useRef(null)
	const editorRef = useRef(null)
	const viewRef = useRef(null)
	const [code, setCode] = useState(`G90
T01
G00 X50.0 Y50.0
G81 X50.0 Y50.0
G81 X100.0 Y50.0
T02
G81 X150.0 Y50.0 D12.0
G81 X200.0 Y50.0 D12.0
G00 X0.0 Y0.0
M30`)
	const [isRunning, setIsRunning] = useState(false)
	const [currentLine, setCurrentLine] = useState(-1)
	const [simulationSpeed, setSimulationSpeed] = useState(500)
	const [materialSize, setMaterialSize] = useState({ width: 600, height: 300 })
	const [holes, setHoles] = useState([])
	const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 })
	const [showTemplates, setShowTemplates] = useState(false)
	const [errors, setErrors] = useState([])
	const [showDebugPanel, setShowDebugPanel] = useState(false)
	const [debugLog, setDebugLog] = useState([])
	const [toolOutOfBounds, setToolOutOfBounds] = useState(false)
	const [report, setReport] = useState(null)
	const [usedTools, setUsedTools] = useState(new Set())

	// Enhanced industrial tool library with categories and names
	const [toolLibrary] = useState({
		1: { diameter: 8, name: 'Круглый 8 мм', category: 'Круглые' },
		2: { diameter: 12, name: 'Круглый 12 мм', category: 'Круглые' },
		3: { diameter: 6, name: 'Круглый 6 мм', category: 'Круглые' },
		4: { diameter: 10, name: 'Круглый 10 мм', category: 'Круглые' },
		5: { diameter: 16, name: 'Круглый 16 мм', category: 'Круглые' },
		6: { diameter: 20, name: 'Круглый 20 мм', category: 'Круглые' },
		7: { diameter: 4.5, name: 'Круглый 4.5 мм', category: 'Круглые' },
		8: { diameter: 25, name: 'Круглый 25 мм', category: 'Круглые' },
		9: { diameter: 30, name: 'Круглый 30 мм', category: 'Круглые' },
		10: { diameter: 3, name: 'Круглый 3 мм', category: 'Круглые' },
		11: { diameter: 32, name: 'Круглый 32 мм', category: 'Круглые' },
		12: { diameter: 35, name: 'Круглый 35 мм', category: 'Круглые' },
		13: { diameter: 40, name: 'Круглый 40 мм', category: 'Круглые' },
		14: { diameter: 50, name: 'Круглый 50 мм', category: 'Круглые' },
		15: { diameter: 2.5, name: 'Круглый 2.5 мм', category: 'Круглые' },
		16: { diameter: 18, name: 'Круглый 18 мм', category: 'Круглые' },
		17: { diameter: 14, name: 'Круглый 14 мм', category: 'Круглые' },
		18: { diameter: 22, name: 'Круглый 22 мм', category: 'Круглые' },
		19: { diameter: 28, name: 'Круглый 28 мм', category: 'Круглые' },
		20: { diameter: 5, name: 'Круглый 5 мм', category: 'Круглые' },
		21: {
			diameter: 0,
			name: 'Квадрат 10×10 мм',
			category: 'Квадратные',
			width: 10,
			height: 10,
		},
		22: {
			diameter: 0,
			name: 'Квадрат 15×15 мм',
			category: 'Квадратные',
			width: 15,
			height: 15,
		},
		23: {
			diameter: 0,
			name: 'Квадрат 20×20 мм',
			category: 'Квадратные',
			width: 20,
			height: 20,
		},
		24: {
			diameter: 0,
			name: 'Квадрат 25×25 мм',
			category: 'Квадратные',
			width: 25,
			height: 25,
		},
		25: {
			diameter: 0,
			name: 'Квадрат 30×30 мм',
			category: 'Квадратные',
			width: 30,
			height: 30,
		},
		26: {
			diameter: 0,
			name: 'Прямоугольник 10×20 мм',
			category: 'Прямоугольные',
			width: 10,
			height: 20,
		},
		27: {
			diameter: 0,
			name: 'Прямоугольник 15×30 мм',
			category: 'Прямоугольные',
			width: 15,
			height: 30,
		},
		28: {
			diameter: 0,
			name: 'Прямоугольник 20×40 мм',
			category: 'Прямоугольные',
			width: 20,
			height: 40,
		},
		29: {
			diameter: 0,
			name: 'Прямоугольник 25×50 мм',
			category: 'Прямоугольные',
			width: 25,
			height: 50,
		},
		30: {
			diameter: 0,
			name: 'Овальный 10×20 мм',
			category: 'Овальные',
			width: 10,
			height: 20,
		},
		31: {
			diameter: 0,
			name: 'Овальный 15×30 мм',
			category: 'Овальные',
			width: 15,
			height: 30,
		},
		32: {
			diameter: 0,
			name: 'Овальный 20×40 мм',
			category: 'Овальные',
			width: 20,
			height: 40,
		},
		33: {
			diameter: 0,
			name: 'Овальный 25×50 мм',
			category: 'Овальные',
			width: 25,
			height: 50,
		},
		34: {
			diameter: 0,
			name: 'Треугольник 20 мм',
			category: 'Специальные',
			width: 20,
			height: 20,
		},
		35: {
			diameter: 0,
			name: 'Шестигранник 20 мм',
			category: 'Специальные',
			width: 20,
			height: 20,
		},
		36: {
			diameter: 0,
			name: 'Крестообразный',
			category: 'Специальные',
			width: 15,
			height: 15,
		},
		37: {
			diameter: 0,
			name: 'Звездообразный',
			category: 'Специальные',
			width: 20,
			height: 20,
		},
		38: {
			diameter: 0,
			name: 'Щель 5×30 мм',
			category: 'Щелевые',
			width: 5,
			height: 30,
		},
		39: {
			diameter: 0,
			name: 'Щель 8×40 мм',
			category: 'Щелевые',
			width: 8,
			height: 40,
		},
		40: {
			diameter: 0,
			name: 'Щель 10×50 мм',
			category: 'Щелевые',
			width: 10,
			height: 50,
		},
	})

	const isRunningRef = useRef(false)
	const operationsRef = useRef([])
	const startTimeRef = useRef(null)
	const totalMoveDistanceRef = useRef(0)
	const drillTimeRef = useRef(0)
	const currentToolRef = useRef(1)
	const readOnlyCompartment = useMemo(() => new Compartment(), [])

	const templates = {
		perforated: {
			name: 'Перфорированный лист',
			category: 'Основные узоры',
			generate: () => {
				const width = 600
				const height = 300
				let gcode = 'G90\nT01\n'
				for (let y = 50; y <= height - 50; y += 50) {
					const startX = Math.floor((y - 50) / 50) % 2 === 0 ? 50 : 75
					gcode += `G00 X${startX}.0 Y${y}.0\n`
					for (
						let x = startX;
						x <= width - (startX === 50 ? 50 : 25);
						x += 50
					) {
						gcode += `G81 X${x}.0 Y${y}.0\n`
					}
				}
				gcode += `G00 X0.0 Y0.0\nM30`
				return { gcode, width, height }
			},
		},
		multiTool: {
			name: 'Многопозиционная обработка',
			category: 'Промышленные',
			generate: () => {
				const width = 600
				const height = 300
				let gcode = 'G90\nT01\n'
				gcode += 'G00 X50.0 Y50.0\n'
				gcode += 'G81 X50.0 Y50.0\n'
				gcode += 'G81 X100.0 Y50.0\n'
				gcode += 'T02\n'
				gcode += 'G81 X150.0 Y50.0\n'
				gcode += 'G81 X200.0 Y50.0\n'
				gcode += 'T21\n'
				gcode += 'G81 X250.0 Y50.0\n'
				gcode += 'G00 X0.0 Y0.0\nM30'
				return { gcode, width, height }
			},
		},
		grid: {
			name: 'Прямоугольная сетка',
			category: 'Основные узоры',
			generate: () => {
				const width = 500
				const height = 400
				let gcode = 'G90\nT01\n'
				for (let y = 40; y <= height - 40; y += 40) {
					gcode += `G00 X40.0 Y${y}.0\n`
					for (let x = 40; x <= width - 40; x += 40) {
						gcode += `G81 X${x}.0 Y${y}.0\n`
					}
				}
				gcode += `G00 X0.0 Y0.0\nM30`
				return { gcode, width, height }
			},
		},
		circular: {
			name: 'Круговая сетка',
			category: 'Основные узоры',
			generate: () => {
				const width = 500
				const height = 500
				const centerX = width / 2
				const centerY = height / 2
				let gcode = 'G90\nT01\n'
				const rings = 4
				const ringSpacing = 60
				for (let ring = 1; ring <= rings; ring++) {
					const radius = ring * ringSpacing
					const holesInRing = Math.floor((2 * Math.PI * radius) / 50)
					for (let i = 0; i < holesInRing; i++) {
						const angle = (i / holesInRing) * 2 * Math.PI
						const x = centerX + radius * Math.cos(angle)
						const y = centerY + radius * Math.sin(angle)
						gcode += `G81 X${x.toFixed(1)} Y${y.toFixed(1)}\n`
					}
				}
				gcode += `G00 X0.0 Y0.0\nM30`
				return { gcode, width, height }
			},
		},
		ventilation: {
			name: 'Вентиляционные отверстия',
			category: 'Промышленные',
			generate: () => {
				const width = 600
				const height = 300
				let gcode = 'G90\nT02\n'
				for (let x = 100; x <= width - 100; x += 100) {
					gcode += `G81 X${x}.0 Y50.0\n`
				}
				for (let x = 75; x <= width - 75; x += 150) {
					gcode += `G81 X${x}.0 Y150.0\n`
				}
				for (let x = 100; x <= width - 100; x += 100) {
					gcode += `G81 X${x}.0 Y250.0\n`
				}
				gcode += `G00 X0.0 Y0.0\nM30`
				return { gcode, width, height }
			},
		},
		mounting: {
			name: 'Монтажные отверстия',
			category: 'Промышленные',
			generate: () => {
				const width = 400
				const height = 300
				let gcode = 'G90\nT04\n'
				gcode += `G81 X20.0 Y20.0\n`
				gcode += `G81 X${width - 20}.0 Y20.0\n`
				gcode += `G81 X20.0 Y${height - 20}.0\n`
				gcode += `G81 X${width - 20}.0 Y${height - 20}.0\n`
				gcode += `G81 X${width / 2}.0 Y50.0\n`
				gcode += `G81 X${width / 2}.0 Y${height - 50}.0\n`
				gcode += `G00 X0.0 Y0.0\nM30`
				return { gcode, width, height }
			},
		},
		electrical: {
			name: 'Электрические крепления',
			category: 'Промышленные',
			generate: () => {
				const width = 500
				const height = 200
				let gcode = 'G90\nT03\n'
				for (let y = 50; y <= height - 50; y += 50) {
					for (let x = 30; x <= width - 30; x += 60) {
						gcode += `G81 X${x}.0 Y${y}.0\n`
					}
				}
				gcode += `G00 X0.0 Y0.0\nM30`
				return { gcode, width, height }
			},
		},
		floral: {
			name: 'Цветочный узор',
			category: 'Декоративные',
			generate: () => {
				const width = 500
				const height = 500
				const centerX = width / 2
				const centerY = height / 2
				let gcode = 'G90\nT01\n'
				gcode += `G81 X${centerX}.0 Y${centerY}.0\n`
				const petalRadius = 80
				for (let i = 0; i < 8; i++) {
					const angle = (i / 8) * 2 * Math.PI
					const x = centerX + petalRadius * Math.cos(angle)
					const y = centerY + petalRadius * Math.sin(angle)
					gcode += `G81 X${x.toFixed(1)} Y${y.toFixed(1)}\n`
				}
				const outerRadius = 150
				const outerHoles = 12
				for (let i = 0; i < outerHoles; i++) {
					const angle = (i / outerHoles) * 2 * Math.PI
					const x = centerX + outerRadius * Math.cos(angle)
					const y = centerY + outerRadius * Math.sin(angle)
					gcode += `G81 X${x.toFixed(1)} Y${y.toFixed(1)}\n`
				}
				gcode += `G00 X0.0 Y0.0\nM30`
				return { gcode, width, height }
			},
		},
		geometric: {
			name: 'Геометрический узор',
			category: 'Декоративные',
			generate: () => {
				const width = 600
				const height = 400
				let gcode = 'G90\nT01\n'
				const triangleSize = 100
				for (let y = 100; y <= height - 100; y += 150) {
					for (let x = 100; x <= width - 100; x += 200) {
						gcode += `G81 X${x}.0 Y${y - triangleSize / 2}.0\n`
						gcode += `G81 X${x - triangleSize / 2}.0 Y${
							y + triangleSize / 2
						}.0\n`
						gcode += `G81 X${x + triangleSize / 2}.0 Y${
							y + triangleSize / 2
						}.0\n`
					}
				}
				gcode += `G00 X0.0 Y0.0\nM30`
				return { gcode, width, height }
			},
		},
		wave: {
			name: 'Волнообразный узор',
			category: 'Декоративные',
			generate: () => {
				const width = 600
				const height = 300
				let gcode = 'G90\nT01\n'
				for (let x = 50; x <= width - 50; x += 25) {
					const y = 150 + 80 * Math.sin((x / 600) * 4 * Math.PI)
					gcode += `G81 X${x}.0 Y${y.toFixed(1)}\n`
				}
				gcode += `G00 X0.0 Y0.0\nM30`
				return { gcode, width, height }
			},
		},
		speaker: {
			name: 'Акустическая решетка',
			category: 'Специализированные',
			generate: () => {
				const width = 400
				const height = 200
				let gcode = 'G90\nT03\n'
				for (let y = 30; y <= height - 30; y += 15) {
					const offset = (Math.floor((y - 30) / 15) % 2) * 7.5
					for (let x = 30 + offset; x <= width - 30; x += 15) {
						gcode += `G81 X${x}.0 Y${y}.0\n`
					}
				}
				gcode += `G00 X0.0 Y0.0\nM30`
				return { gcode, width, height }
			},
		},
		filter: {
			name: 'Фильтрационная сетка',
			category: 'Специализированные',
			generate: () => {
				const width = 500
				const height = 300
				let gcode = 'G90\nT05\n'
				for (let y = 20; y <= height - 20; y += 10) {
					for (let x = 20; x <= width - 20; x += 10) {
						gcode += `G81 X${x}.0 Y${y}.0\n`
					}
				}
				gcode += `G00 X0.0 Y0.0\nM30`
				return { gcode, width, height }
			},
		},
		heatSink: {
			name: 'Радиатор охлаждения',
			category: 'Специализированные',
			generate: () => {
				const width = 300
				const height = 400
				let gcode = 'G90\nT02\n'
				for (let x = 50; x <= width - 50; x += 50) {
					for (let y = 40; y <= height - 40; y += 40) {
						gcode += `G81 X${x}.0 Y${y}.0\n`
					}
				}
				gcode += `G00 X0.0 Y0.0\nM30`
				return { gcode, width, height }
			},
		},
		lattice: {
			name: 'Решетчатый узор',
			category: 'Архитектурные',
			generate: () => {
				const width = 600
				const height = 400
				let gcode = 'G90\nT01\n'
				for (let i = 0; i < 8; i++) {
					const x1 = i * 75
					const y1 = 0
					const x2 = 0
					const y2 = i * 50
					if (x1 <= width && y1 <= height) {
						gcode += `G81 X${x1}.0 Y${y1}.0\n`
					}
					if (x2 <= width && y2 <= height) {
						gcode += `G81 X${x2}.0 Y${y2}.0\n`
					}
				}
				for (let i = 0; i < 8; i++) {
					const x1 = width - i * 75
					const y1 = 0
					const x2 = width
					const y2 = i * 50
					if (x1 >= 0 && y1 <= height) {
						gcode += `G81 X${x1}.0 Y${y1}.0\n`
					}
					if (x2 >= 0 && y2 <= height) {
						gcode += `G81 X${x2}.0 Y${y2}.0\n`
					}
				}
				gcode += `G00 X0.0 Y0.0\nM30`
				return { gcode, width, height }
			},
		},
		ornamental: {
			name: 'Орнаментальный узор',
			category: 'Архитектурные',
			generate: () => {
				const width = 500
				const height = 500
				let gcode = 'G90\nT01\n'
				const border = 50
				for (let x = border; x <= width - border; x += 40) {
					gcode += `G81 X${x}.0 Y${border}.0\n`
					gcode += `G81 X${x}.0 Y${height - border}.0\n`
				}
				for (let y = border; y <= height - border; y += 40) {
					gcode += `G81 X${border}.0 Y${y}.0\n`
					gcode += `G81 X${width - border}.0 Y${y}.0\n`
				}
				gcode += `G81 X${width / 2}.0 Y${border}.0\n`
				gcode += `G81 X${width / 2}.0 Y${height - border}.0\n`
				gcode += `G81 X${border}.0 Y${height / 2}.0\n`
				gcode += `G81 X${width - border}.0 Y${height / 2}.0\n`
				gcode += `G00 X0.0 Y0.0\nM30`
				return { gcode, width, height }
			},
		},
		custom1: {
			name: 'Сердце',
			category: 'Фигуры',
			generate: () => {
				const width = 400
				const height = 300
				const centerX = width / 2
				const centerY = height / 2
				let gcode = 'G90\nT01\n'
				for (let t = 0; t <= 2 * Math.PI; t += 0.2) {
					const x = 16 * Math.pow(Math.sin(t), 3)
					const y = -(
						13 * Math.cos(t) -
						5 * Math.cos(2 * t) -
						2 * Math.cos(3 * t) -
						Math.cos(4 * t)
					)
					const scaledX = centerX + x * 3
					const scaledY = centerY + y * 3
					if (
						scaledX >= 0 &&
						scaledX <= width &&
						scaledY >= 0 &&
						scaledY <= height
					) {
						gcode += `G81 X${scaledX.toFixed(1)} Y${scaledY.toFixed(1)}\n`
					}
				}
				gcode += `G00 X0.0 Y0.0\nM30`
				return { gcode, width, height }
			},
		},
		custom2: {
			name: 'Звезда',
			category: 'Фигуры',
			generate: () => {
				const width = 400
				const height = 400
				const centerX = width / 2
				const centerY = height / 2
				let gcode = 'G90\nT02\n'
				const outerRadius = 120
				const innerRadius = 60
				const points = 5
				for (let i = 0; i < points * 2; i++) {
					const radius = i % 2 === 0 ? outerRadius : innerRadius
					const angle = (i / (points * 2)) * 2 * Math.PI - Math.PI / 2
					const x = centerX + radius * Math.cos(angle)
					const y = centerY + radius * Math.sin(angle)
					gcode += `G81 X${x.toFixed(1)} Y${y.toFixed(1)}\n`
				}
				gcode += `G00 X0.0 Y0.0\nM30`
				return { gcode, width, height }
			},
		},
		custom3: {
			name: 'Спираль',
			category: 'Фигуры',
			generate: () => {
				const width = 500
				const height = 500
				const centerX = width / 2
				const centerY = height / 2
				let gcode = 'G90\nT03\n'
				for (let t = 0; t <= 10; t += 0.3) {
					const radius = t * 20
					const angle = t
					const x = centerX + radius * Math.cos(angle)
					const y = centerY + radius * Math.sin(angle)
					if (x >= 20 && x <= width - 20 && y >= 20 && y <= height - 20) {
						gcode += `G81 X${x.toFixed(1)} Y${y.toFixed(1)}\n`
					}
				}
				gcode += `G00 X0.0 Y0.0\nM30`
				return { gcode, width, height }
			},
		},
		honeycomb: {
			name: 'Соты',
			category: 'Дополнительные',
			generate: () => {
				const width = 600
				const height = 400
				let gcode = 'G90\nT01\n'
				const hexWidth = 60
				const hexHeight = (hexWidth * Math.sqrt(3)) / 2
				const cols = Math.floor(width / (hexWidth * 1.5))
				const rows = Math.floor(height / hexHeight)
				for (let row = 0; row < rows; row++) {
					const yOffset = row * hexHeight
					const xOffset = (row % 2) * hexWidth * 0.75
					for (let col = 0; col < cols; col++) {
						const x = 50 + xOffset + col * hexWidth * 1.5
						const y = 50 + yOffset
						if (x <= width - 50 && y <= height - 50) {
							gcode += `G81 X${x.toFixed(1)} Y${y.toFixed(1)}\n`
						}
					}
				}
				gcode += `G00 X0.0 Y0.0\nM30`
				return { gcode, width, height }
			},
		},
		diamond: {
			name: 'Ромбовидный узор',
			category: 'Дополнительные',
			generate: () => {
				const width = 500
				const height = 400
				let gcode = 'G90\nT01\n'
				const spacing = 60
				for (let y = 50; y <= height - 50; y += spacing) {
					const offset = ((Math.floor((y - 50) / spacing) % 2) * spacing) / 2
					for (let x = 50 + offset; x <= width - 50; x += spacing) {
						gcode += `G81 X${x}.0 Y${y}.0\n`
					}
				}
				gcode += `G00 X0.0 Y0.0\nM30`
				return { gcode, width, height }
			},
		},
		checkerboard: {
			name: 'Шахматная доска',
			category: 'Дополнительные',
			generate: () => {
				const width = 480
				const height = 480
				let gcode = 'G90\nT02\n'
				const squareSize = 60
				for (let row = 0; row < 8; row++) {
					for (let col = 0; col < 8; col++) {
						if ((row + col) % 2 === 0) {
							const x = 60 + col * squareSize
							const y = 60 + row * squareSize
							gcode += `G81 X${x}.0 Y${y}.0\n`
						}
					}
				}
				gcode += `G00 X0.0 Y0.0\nM30`
				return { gcode, width, height }
			},
		},
	}

	const applyTemplate = templateKey => {
		const template = templates[templateKey]
		if (template) {
			const { gcode, width, height } = template.generate()
			setCode(gcode)
			setMaterialSize({ width, height })
			resetSimulation()
		}
	}

	const parseGCode = gcode => {
		const lines = gcode.split('\n')
		const operations = []
		const errors = []
		let currentMode = 'absolute'
		let currentCommand = null
		let currentX = 0
		let currentY = 0
		let currentTool = 1

		for (let i = 0; i < lines.length; i++) {
			const originalLine = lines[i]
			const lineNum = i
			let line = originalLine.trim()
			if (line === '') continue
			line = line.replace(/\([^)]*\)/g, '').trim()
			if (line === '' || line === '%') continue

			const upperLine = line.toUpperCase()

			if (upperLine.includes('G90')) {
				currentMode = 'absolute'
				continue
			}
			if (upperLine.includes('G91')) {
				currentMode = 'relative'
				continue
			}

			const toolMatch = upperLine.match(/T(\d+)/)
			if (toolMatch) {
				const toolNumber = parseInt(toolMatch[1], 10)
				if (!toolLibrary[toolNumber]) {
					errors.push({
						line: lineNum,
						message: `Инструмент T${toolNumber} не найден в библиотеке`,
					})
				}
				currentTool = toolNumber
				operations.push({
					type: 'tool_change',
					toolNumber,
					line: lineNum,
				})
				continue
			}

			const commandMatch = upperLine.match(/G(\d+)/)
			if (commandMatch) currentCommand = `G${commandMatch[1]}`
			const commandToUse = commandMatch ? `G${commandMatch[1]}` : currentCommand

			if (!commandToUse || (commandToUse !== 'G00' && commandToUse !== 'G81'))
				continue

			const xMatch = upperLine.match(/X([\d.\-+eE]+)/)
			const yMatch = upperLine.match(/Y([\d.\-+eE]+)/)
			const dMatch = upperLine.match(/D([\d.\-+eE]+)/)

			let x = xMatch ? parseFloat(xMatch[1]) : null
			let y = yMatch ? parseFloat(yMatch[1]) : null
			const toolInfo = toolLibrary[currentTool] || { diameter: 8 }
			const d = dMatch ? parseFloat(dMatch[1]) : toolInfo.diameter

			if (currentMode === 'relative') {
				x = x !== null ? currentX + x : currentX
				y = y !== null ? currentY + y : currentY
			} else {
				if (x === null) x = currentX
				if (y === null) y = currentY
			}

			if (commandToUse === 'G81' && (x === null || y === null)) {
				errors.push({
					line: lineNum,
					message: 'G81 requires both X and Y coordinates',
				})
				continue
			}

			if (x !== null) currentX = x
			if (y !== null) currentY = y

			if (commandToUse === 'G00') {
				operations.push({
					type: 'move',
					x: currentX,
					y: currentY,
					tool: currentTool,
					line: lineNum,
				})
			} else if (commandToUse === 'G81') {
				operations.push({
					type: 'drill',
					x: currentX,
					y: currentY,
					diameter: d,
					tool: currentTool,
					line: lineNum,
				})
			}
		}
		operations.push({ type: 'end', line: lines.length - 1 })
		return { operations, errors }
	}

	const drawSimulation = useCallback(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const safeWidth = materialSize.width > 0 ? materialSize.width : 600
		const safeHeight = materialSize.height > 0 ? materialSize.height : 300
		const ctx = canvas.getContext('2d')
		const scaleX = canvas.width / safeWidth
		const scaleY = canvas.height / safeHeight
		const scale = Math.min(scaleX, scaleY)

		ctx.fillStyle = '#ffffff'
		ctx.fillRect(0, 0, canvas.width, canvas.height)

		ctx.strokeStyle = '#718896'
		ctx.lineWidth = 2
		ctx.strokeRect(0, 0, safeWidth * scale, safeHeight * scale)

		holes.forEach(hole => {
			const toolInfo = toolLibrary[hole.tool] || { diameter: hole.diameter }
			const isRound = toolInfo.category === 'Круглые'
			const x = hole.x * scale
			const y = hole.y * scale

			ctx.fillStyle = '#2D2D2D'

			if (isRound) {
				const radius = (hole.diameter / 2) * scale
				ctx.beginPath()
				ctx.arc(x, y, radius, 0, 2 * Math.PI)
				ctx.fill()
				ctx.strokeStyle = '#ffffff'
				ctx.lineWidth = 1
				ctx.beginPath()
				ctx.moveTo(x - radius, y)
				ctx.lineTo(x + radius, y)
				ctx.moveTo(x, y - radius)
				ctx.lineTo(x, y + radius)
				ctx.stroke()
			} else {
				const w = (toolInfo.width || hole.diameter) * scale
				const h = (toolInfo.height || hole.diameter) * scale
				ctx.fillRect(x - w / 2, y - h / 2, w, h)
				ctx.strokeStyle = '#ffffff'
				ctx.lineWidth = 1
				ctx.strokeRect(x - w / 2, y - h / 2, w, h)
			}
		})

		if (currentPosition.x >= 0 && currentPosition.y >= 0) {
			const x = currentPosition.x * scale
			const y = currentPosition.y * scale
			const currentToolInfo = toolLibrary[currentToolRef.current] || {
				diameter: 8,
			}
			const isRound = currentToolInfo.category === 'Круглые'

			let isOutOfBounds = false
			if (isRound) {
				const toolRadius = (currentToolInfo.diameter * scale) / 2
				isOutOfBounds =
					currentPosition.x - currentToolInfo.diameter / 2 < 0 ||
					currentPosition.x + currentToolInfo.diameter / 2 > safeWidth ||
					currentPosition.y - currentToolInfo.diameter / 2 < 0 ||
					currentPosition.y + currentToolInfo.diameter / 2 > safeHeight

				ctx.fillStyle = isOutOfBounds
					? 'rgba(220, 53, 69, 0.3)'
					: 'rgba(113, 136, 150, 0.3)'
				ctx.beginPath()
				ctx.arc(x, y, toolRadius, 0, 2 * Math.PI)
				ctx.fill()
				ctx.fillStyle = '#718896'
				ctx.beginPath()
				ctx.arc(x, y, 8, 0, 2 * Math.PI)
				ctx.fill()
				ctx.strokeStyle = isOutOfBounds ? '#dc3545' : '#2D2D2D'
				ctx.lineWidth = 2
				ctx.beginPath()
				ctx.arc(x, y, toolRadius, 0, 2 * Math.PI)
				ctx.stroke()
			} else {
				const w = (currentToolInfo.width || 8) * scale
				const h = (currentToolInfo.height || 8) * scale
				isOutOfBounds =
					currentPosition.x - w / 2 < 0 ||
					currentPosition.x + w / 2 > safeWidth * scale ||
					currentPosition.y - h / 2 < 0 ||
					currentPosition.y + h / 2 > safeHeight * scale

				ctx.fillStyle = isOutOfBounds
					? 'rgba(220, 53, 69, 0.3)'
					: 'rgba(113, 136, 150, 0.3)'
				ctx.fillRect(x - w / 2, y - h / 2, w, h)
				ctx.fillStyle = '#718896'
				ctx.fillRect(x - 4, y - 4, 8, 8)
				ctx.strokeStyle = isOutOfBounds ? '#dc3545' : '#2D2D2D'
				ctx.lineWidth = 2
				ctx.strokeRect(x - w / 2, y - h / 2, w, h)
			}

			setToolOutOfBounds(isOutOfBounds)
		}
	}, [holes, currentPosition, materialSize, toolLibrary])

	useEffect(() => {
		drawSimulation()
	}, [drawSimulation])

	const calculateDistance = (x1, y1, x2, y2) => {
		return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
	}

	const runSimulation = async () => {
		if (isRunning) return
		const { operations, errors: parseErrors } = parseGCode(code)
		if (parseErrors.length > 0) {
			setErrors(parseErrors)
			return
		}
		operationsRef.current = operations
		setErrors([])
		setIsRunning(true)
		isRunningRef.current = true
		setHoles([])
		setCurrentPosition({ x: 0, y: 0 })
		setCurrentLine(-1)
		setDebugLog([])
		setToolOutOfBounds(false)
		setReport(null)
		setUsedTools(new Set())
		startTimeRef.current = Date.now()
		totalMoveDistanceRef.current = 0
		drillTimeRef.current = 0
		let lastX = 0
		let lastY = 0
		let holeCount = 0
		currentToolRef.current = 1

		for (let i = 0; i < operations.length; i++) {
			if (!isRunningRef.current) break
			const op = operations[i]
			setCurrentLine(op.line)

			if (op.type === 'tool_change') {
				currentToolRef.current = op.toolNumber
				setUsedTools(prev => new Set([...prev, op.toolNumber]))
				const logEntry = {
					timestamp: new Date().toLocaleTimeString(),
					operation: `Смена инструмента на T${op.toolNumber} (${
						toolLibrary[op.toolNumber]?.name || 'Неизвестен'
					})`,
					line: op.line + 1,
				}
				setDebugLog(prev => [...prev.slice(-19), logEntry])
				await new Promise(resolve => setTimeout(resolve, simulationSpeed / 4))
				continue
			}

			const toolInfo = toolLibrary[op.tool] || {
				diameter: 8,
				name: 'Неизвестен',
			}
			const logEntry = {
				timestamp: new Date().toLocaleTimeString(),
				operation:
					op.type === 'move'
						? 'Перемещение'
						: op.type === 'drill'
						? 'Пробивка'
						: 'Завершение',
				x: op.x?.toFixed(1) || '0',
				y: op.y?.toFixed(1) || '0',
				diameter: op.diameter?.toFixed(1) || 'N/A',
				tool: op.tool,
				toolName: toolInfo.name,
				line: op.line + 1,
			}
			setDebugLog(prev => [...prev.slice(-19), logEntry])

			if (op.type === 'move') {
				const dist = calculateDistance(lastX, lastY, op.x, op.y)
				totalMoveDistanceRef.current += dist
				lastX = op.x
				lastY = op.y
				setCurrentPosition({ x: op.x, y: op.y })
				await new Promise(resolve => setTimeout(resolve, simulationSpeed / 2))
			} else if (op.type === 'drill') {
				const dist = calculateDistance(lastX, lastY, op.x, op.y)
				totalMoveDistanceRef.current += dist
				lastX = op.x
				lastY = op.y
				setCurrentPosition({ x: op.x, y: op.y })
				await new Promise(resolve => setTimeout(resolve, simulationSpeed / 2))
				setHoles(prev => [
					...prev,
					{ x: op.x, y: op.y, diameter: op.diameter, tool: op.tool },
				])
				holeCount++
				drillTimeRef.current += simulationSpeed / 2
				setUsedTools(prev => new Set([...prev, op.tool]))
				await new Promise(resolve => setTimeout(resolve, simulationSpeed / 2))
			} else if (op.type === 'end') {
				break
			}
		}

		const endTime = Date.now()
		const totalTimeMs = endTime - startTimeRef.current
		const totalTimeSec = totalTimeMs / 1000
		const totalTimeMin = totalTimeSec / 60
		const holesPerMinute = totalTimeMin > 0 ? holeCount / totalTimeMin : 0
		const efficiency =
			totalTimeSec > 0 ? drillTimeRef.current / 1000 / totalTimeSec : 0
		const reportData = {
			totalTimeSec: totalTimeSec.toFixed(1),
			totalTimeMin: totalTimeMin.toFixed(2),
			holeCount,
			holesPerMinute: holesPerMinute.toFixed(1),
			totalMoveDistance: totalMoveDistanceRef.current.toFixed(1),
			efficiency: (efficiency * 100).toFixed(1),
			completionTime: new Date(),
		}
		setReport(reportData)
		setIsRunning(false)
		isRunningRef.current = false
		setCurrentLine(-1)
	}

	const stopSimulation = () => {
		setIsRunning(false)
		isRunningRef.current = false
	}

	const resetSimulation = () => {
		setIsRunning(false)
		isRunningRef.current = false
		setHoles([])
		setCurrentPosition({ x: 0, y: 0 })
		setCurrentLine(-1)
		setErrors([])
		setDebugLog([])
		setToolOutOfBounds(false)
		setReport(null)
		setUsedTools(new Set())
		currentToolRef.current = 1
	}

	const downloadGCode = () => {
		const blob = new Blob([code], { type: 'text/plain' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = 'amada_program.nc'
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}

	const jumpToLine = lineIndex => {
		if (lineIndex < 0 || lineIndex >= operationsRef.current.length) return
		const op = operationsRef.current[lineIndex]
		setCurrentLine(op.line)
		if (op.type === 'tool_change') {
			currentToolRef.current = op.toolNumber
			setCurrentPosition({ x: 0, y: 0 })
		} else {
			setCurrentPosition({ x: op.x, y: op.y })
		}
		const newHoles = []
		const used = new Set()
		for (let i = 0; i <= lineIndex; i++) {
			const currentOp = operationsRef.current[i]
			if (currentOp.type === 'drill') {
				newHoles.push({
					x: currentOp.x,
					y: currentOp.y,
					diameter: currentOp.diameter,
					tool: currentOp.tool,
				})
				used.add(currentOp.tool)
			} else if (currentOp.type === 'tool_change') {
				used.add(currentOp.toolNumber)
			}
		}
		setHoles(newHoles)
		setUsedTools(used)
		const safeWidth = materialSize.width > 0 ? materialSize.width : 600
		const safeHeight = materialSize.height > 0 ? materialSize.height : 300
		let isOutOfBounds = false
		if (op.type !== 'tool_change') {
			const currentToolInfo = toolLibrary[currentToolRef.current] || {
				diameter: 8,
			}
			const isRound = currentToolInfo.category === 'Круглые'
			if (isRound) {
				isOutOfBounds =
					op.x - currentToolInfo.diameter / 2 < 0 ||
					op.x + currentToolInfo.diameter / 2 > safeWidth ||
					op.y - currentToolInfo.diameter / 2 < 0 ||
					op.y + currentToolInfo.diameter / 2 > safeHeight
			} else {
				const w = currentToolInfo.width || 8
				const h = currentToolInfo.height || 8
				isOutOfBounds =
					op.x - w / 2 < 0 ||
					op.x + w / 2 > safeWidth ||
					op.y - h / 2 < 0 ||
					op.y + h / 2 > safeHeight
			}
		}
		setToolOutOfBounds(isOutOfBounds)
	}

	const categories = useMemo(() => {
		const cats = {}
		Object.entries(templates).forEach(([key, template]) => {
			if (!cats[template.category]) cats[template.category] = []
			cats[template.category].push({ key, ...template })
		})
		return cats
	}, [])

	const toolCategories = useMemo(() => {
		const cats = {}
		Object.entries(toolLibrary).forEach(([pos, tool]) => {
			if (!cats[tool.category]) cats[tool.category] = []
			cats[tool.category].push({ position: parseInt(pos), ...tool })
		})
		return cats
	}, [toolLibrary])

	// Initialize CodeMirror
	useEffect(() => {
		if (!editorRef.current) return
		const extensions = [
			lineNumbers(),
			highlightActiveLineGutter(),
			syntaxHighlighting(gcodeHighlight),
			StreamLanguage.define(gcodeConfig),
			keymap.of(defaultKeymap),
			readOnlyCompartment.of(EditorState.readOnly.of(false)),
			EditorView.updateListener.of(update => {
				if (update.docChanged) {
					const newCode = update.state.doc.toString()
					setCode(newCode)
					setErrors([])
					setDebugLog([])
					setToolOutOfBounds(false)
				}
			}),
			EditorView.theme({
				'&': {
					height: '24rem',
					fontSize: '0.875rem',
					fontFamily: "'Fira Code', 'Courier New', monospace",
				},
				'.cm-content': {
					padding: '1rem',
				},
				'.cm-gutters': {
					backgroundColor: '#ffffff',
					borderRight: '2px solid #e9ecef',
					color: '#718896',
				},
				'.cm-activeLineGutter': {
					backgroundColor: '#f8f9fa',
					color: '#2D2D2D',
				},
			}),
		]
		const state = EditorState.create({
			doc: code,
			extensions,
		})
		const view = new EditorView({
			state,
			parent: editorRef.current,
		})
		viewRef.current = view
		return () => {
			view.destroy()
		}
	}, [])

	// Update code in editor
	useEffect(() => {
		if (viewRef.current) {
			const currentDoc = viewRef.current.state.doc.toString()
			if (currentDoc !== code) {
				viewRef.current.dispatch({
					changes: {
						from: 0,
						to: viewRef.current.state.doc.length,
						insert: code,
					},
				})
			}
		}
	}, [code])

	// Update readonly state
	useEffect(() => {
		if (viewRef.current) {
			viewRef.current.dispatch({
				effects: readOnlyCompartment.reconfigure(
					EditorState.readOnly.of(isRunning)
				),
			})
		}
	}, [isRunning, readOnlyCompartment])

	return (
		<>
			<style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; min-height: 100vh; color: #2D2D2D; }
        .app-container { max-width: 1400px; margin: 0 auto; padding: 0 1rem; }
        .header { background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-bottom: 1px solid #e9ecef; padding: 1rem; }
        .header-content { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        .logo { display: flex; align-items: center; gap: 0.75rem; }
        .logo-icon { width: 2.5rem; height: 2.5rem; background: #2D2D2D; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.125rem; }
        .logo-text h1 { font-size: 1.5rem; font-weight: 700; color: #2D2D2D; }
        .logo-text p { font-size: 0.875rem; color: #718896; }
        .header-actions { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
        .btn { padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 0.5rem; border: 2px solid transparent; font-size: 0.875rem; font-family: inherit; white-space: nowrap; }
        .btn-secondary { background: #718896; color: white; }
        .btn-secondary:hover { background: #5a6e7a; transform: translateY(-1px); }
        .btn-primary { background: #2D2D2D; color: white; }
        .btn-primary:hover { background: #1a1a1a; transform: translateY(-1px); }
        .templates-dropdown { position: relative; display: inline-block; }
        .templates-menu { position: absolute; top: 100%; right: 0; background: white; border: 1px solid #e9ecef; border-radius: 0.75rem; box-shadow: 0 10px 25px rgba(0,0,0,0.15); z-index: 1000; min-width: 300px; max-height: 400px; overflow-y: auto; padding: 1rem; margin-top: 0.5rem; }
        .category-title { font-size: 0.875rem; font-weight: 700; color: #2D2D2D; margin: 0.75rem 0 0.5rem 0; padding-bottom: 0.25rem; border-bottom: 1px solid #e9ecef; }
        .template-item { padding: 0.5rem 0.75rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; transition: background-color 0.2s; color: #2D2D2D; }
        .template-item:hover { background: #f8f9fa; }
        .main-content { padding: 1.5rem 0.5rem; }
        .grid { display: grid; gap: 1.5rem; }
        @media (min-width: 768px) { .grid { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 1024px) { .grid { grid-template-columns: 1fr 1fr; gap: 2rem; } }
        @media (min-width: 1400px) { .grid { grid-template-columns: 1fr 1fr 300px; } }
        .card { background: white; border-radius: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e9ecef; width: 100%; }
        .card-header { padding: 1.25rem; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
        .card-title { display: flex; align-items: center; gap: 0.5rem; font-size: 1.125rem; font-weight: 700; color: #2D2D2D; }
        .card-body { padding: 1.25rem; }
        .code-editor-container { height: 20rem; border: 2px solid #e9ecef; border-radius: 0.75rem; overflow: hidden; }
        @media (min-width: 768px) { .code-editor-container { height: 24rem; } }
        .code-hints { margin-top: 1rem; font-size: 0.75rem; color: #718896; line-height: 1.5; }
        .code-hints p { margin-bottom: 0.25rem; }
        .form-grid { display: grid; gap: 1rem; margin-bottom: 1.25rem; }
        @media (min-width: 768px) { .form-grid { grid-template-columns: 1fr 1fr; gap: 1.25rem; } }
        .form-group { margin-bottom: 0.75rem; }
        .form-label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: #2D2D2D; }
        .form-control { width: 100%; padding: 0.75rem; border: 2px solid #e9ecef; border-radius: 0.75rem; font-size: 0.875rem; color: #2D2D2D; font-family: inherit; }
        .form-control:focus { outline: none; border-color: #718896; }
        .form-control[type="range"] { padding: 0; height: 6px; -webkit-appearance: none; background: #e9ecef; border-radius: 3px; }
        .form-control[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #2D2D2D; cursor: pointer; }
        .controls-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .btn-full { flex: 1; min-width: 120px; padding: 0.75rem; font-size: 0.875rem; font-weight: 600; }
        .btn-success { background: #28a745; color: white; }
        .btn-success:hover { background: #218838; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-danger:hover { background: #c82333; }
        .btn-dark { background: #2D2D2D; color: white; padding: 0.75rem; }
        .btn-dark:hover { background: #1a1a1a; }
        .canvas-container { background: #ffffff; border-radius: 0.75rem; padding: 1rem; border: 2px solid #e9ecef; position: relative; }
        .canvas-element { width: 100%; height: auto; background: white; border-radius: 0.5rem; border: 2px solid #e9ecef; min-height: 200px; }
        @media (min-width: 768px) { .canvas-element { min-height: 300px; } }
        @media (min-width: 1024px) { .canvas-element { min-height: 400px; } }
        .canvas-info { margin-top: 1rem; font-size: 0.875rem; color: #718896; line-height: 1.5; }
        .canvas-info p { margin-bottom: 0.25rem; }
        .current-line { background: #f8f9fa; padding: 0.25rem 0.75rem; border-radius: 20px; font-family: 'Courier New', monospace; font-size: 0.875rem; color: #2D2D2D; border: 1px solid #e9ecef; }
        .error-list { margin-top: 1rem; padding: 0.75rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 0.5rem; color: #721c24; font-size: 0.875rem; }
        .error-item { margin-bottom: 0.25rem; }
        .out-of-bounds-warning { display: flex; align-items: center; gap: 0.5rem; background: #f8d7da; color: #721c24; padding: 0.75rem; border-radius: 0.5rem; margin-top: 1rem; font-size: 0.875rem; border: 1px solid #f5c6cb; }
        .jump-controls { display: flex; gap: 0.5rem; align-items: center; margin-top: 1rem; flex-wrap: wrap; }
        .jump-input { padding: 0.5rem; border: 2px solid #e9ecef; border-radius: 0.5rem; width: 80px; font-size: 0.875rem; }
        .debug-panel { background: white; border-radius: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e9ecef; margin-top: 1.5rem; overflow: hidden; }
        .debug-header { padding: 1rem 1.25rem; background: #f8f9fa; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .debug-content { padding: 1.25rem; display: grid; gap: 1.25rem; }
        .debug-coordinates { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 0.75rem; }
        @media (min-width: 768px) { .debug-coordinates { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; } }
        .coord-card { background: #f8f9fa; padding: 0.75rem; border-radius: 0.75rem; text-align: center; }
        @media (min-width: 768px) { .coord-card { padding: 1rem; } }
        .coord-value { font-size: 1.25rem; font-weight: 700; color: #2D2D2D; margin-top: 0.5rem; }
        @media (min-width: 768px) { .coord-value { font-size: 1.5rem; } }
        .coord-label { font-size: 0.75rem; color: #718896; }
        @media (min-width: 768px) { .coord-label { font-size: 0.875rem; } }
        .debug-log { max-height: 150px; overflow-y: auto; background: #f8f9fa; border-radius: 0.75rem; padding: 0.75rem; font-size: 0.75rem; }
        @media (min-width: 768px) { .debug-log { max-height: 200px; padding: 1rem; font-size: 0.875rem; } }
        .log-entry { padding: 0.25rem 0; border-bottom: 1px solid #e9ecef; display: grid; grid-template-columns: 70px 1fr; gap: 0.5rem; }
        @media (min-width: 768px) { .log-entry { padding: 0.5rem 0; grid-template-columns: 80px 1fr; } }
        .log-time { color: #718896; font-weight: 600; }
        .log-details { color: #2D2D2D; }
        .report-panel { background: white; border-radius: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e9ecef; margin-top: 1.5rem; }
        .report-header { padding: 1rem 1.25rem; background: #f8f9fa; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; }
        .report-content { padding: 1.25rem; }
        .report-placeholder { text-align: center; padding: 2rem; color: #718896; font-style: italic; }
        .report-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .report-item { background: #f8f9fa; padding: 1rem; border-radius: 0.75rem; text-align: center; }
        .report-value { font-size: 1.25rem; font-weight: 700; color: #2D2D2D; margin-top: 0.5rem; }
        .report-label { font-size: 0.875rem; color: #718896; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .tools-panel { background: white; border-radius: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e9ecef; margin-top: 1.5rem; }
        .tools-header { padding: 1rem 1.25rem; background: #f8f9fa; border-bottom: 1px solid #e9ecef; }
        .tools-content { padding: 1.25rem; }
        .tool-category { margin-bottom: 1.5rem; }
        .tool-category-title { font-size: 0.875rem; font-weight: 700; color: #2D2D2D; margin-bottom: 0.75rem; padding-bottom: 0.25rem; border-bottom: 1px solid #e9ecef; }
        .tool-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem; background: #f8f9fa; }
        .tool-info { display: flex; align-items: center; gap: 0.5rem; }
        .tool-used { color: #28a745; }
        .tool-not-used { color: #718896; }
        @media (max-width: 767px) {
          .header-content { flex-direction: column; text-align: center; }
          .header-actions { justify-content: center; }
          .controls-row { flex-direction: column; }
          .btn-full { width: 100%; }
          .templates-menu { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%; max-width: 400px; max-height: 80vh; z-index: 2000; }
          .main-content { padding: 1rem 0.5rem; }
          .card { margin-bottom: 1rem; }
        }
      `}</style>
			<header className='header'>
				<div className='app-container'>
					<div className='header-content'>
						<div className='logo'>
							<div className='logo-icon'>A</div>
							<div className='logo-text'>
								<h1>Amada CNC Simulator</h1>
								<p>Координатно-револьверный пробивной пресс</p>
							</div>
						</div>
						<div className='header-actions'>
							<div className='templates-dropdown'>
								<button
									onClick={() => setShowTemplates(!showTemplates)}
									className='btn btn-secondary'
								>
									<Grid3X3 size={16} />
									Заготовки
									<ChevronDown size={16} style={{ marginLeft: '0.5rem' }} />
								</button>
								{showTemplates && (
									<div className='templates-menu'>
										{Object.entries(categories).map(([category, items]) => (
											<div key={category}>
												<div className='category-title'>{category}</div>
												{items.map(item => (
													<div
														key={item.key}
														className='template-item'
														onClick={() => applyTemplate(item.key)}
													>
														{item.name}
													</div>
												))}
											</div>
										))}
									</div>
								)}
							</div>
							<button onClick={downloadGCode} className='btn btn-primary'>
								<Download size={16} />
								Скачать
							</button>
						</div>
					</div>
				</div>
			</header>
			<div className='app-container'>
				<div className='main-content'>
					<div className='grid'>
						<div className='card'>
							<div className='card-header'>
								<div className='card-title'>
									<Code size={20} />
									G-код
								</div>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.75rem',
										flexWrap: 'wrap',
									}}
								>
									<span
										style={{
											fontSize: '0.875rem',
											color: '#718896',
											fontWeight: '600',
										}}
									>
										Строка:
									</span>
									<span className='current-line'>
										{currentLine >= 0 ? currentLine + 1 : '-'}
									</span>
								</div>
							</div>
							<div className='card-body'>
								<div className='code-editor-container' ref={editorRef} />
								{errors.length > 0 && (
									<div className='error-list'>
										{errors.map((error, index) => (
											<div key={index} className='error-item'>
												Строка {error.line + 1}: {error.message}
											</div>
										))}
									</div>
								)}
								<div className='code-hints'>
									<p>• G00 X__ Y__ - Быстрое перемещение</p>
									<p>• G81 X__ Y__ D__ - Пробивка отверстия</p>
									<p>• Txx - Смена инструмента (xx = номер позиции)</p>
									<p>• G90 - Абсолютные координаты (по умолчанию)</p>
									<p>• G91 - Относительные координаты</p>
									<p>• M30 - Конец программы</p>
									<p>• (комментарий) - Комментарии в скобках игнорируются</p>
									<p>• % - Маркеры начала/конца программы игнорируются</p>
								</div>
							</div>
						</div>
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: '1.5rem',
							}}
						>
							<div className='card'>
								<div className='card-body'>
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											marginBottom: '1.25rem',
											flexWrap: 'wrap',
											gap: '0.75rem',
										}}
									>
										<div className='card-title'>
											<Eye size={20} />
											Симуляция
										</div>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
												fontSize: '0.875rem',
												color: '#718896',
											}}
										>
											<Settings size={16} />
											Настройки
										</div>
									</div>
									<div className='form-grid'>
										<div className='form-group'>
											<label className='form-label'>
												Ширина материала (мм)
											</label>
											<input
												type='text'
												inputMode='numeric'
												value={materialSize.width}
												onChange={e => {
													const val = e.target.value.replace(/\D/g, '')
													setMaterialSize(prev => ({
														...prev,
														width: val === '' ? 1 : parseInt(val),
													}))
												}}
												className='form-control'
											/>
										</div>
										<div className='form-group'>
											<label className='form-label'>
												Высота материала (мм)
											</label>
											<input
												type='text'
												inputMode='numeric'
												value={materialSize.height}
												onChange={e => {
													const val = e.target.value.replace(/\D/g, '')
													setMaterialSize(prev => ({
														...prev,
														height: val === '' ? 1 : parseInt(val),
													}))
												}}
												className='form-control'
											/>
										</div>
										<div className='form-group'>
											<label className='form-label'>
												Скорость симуляции (мс)
											</label>
											<input
												type='range'
												min='100'
												max='3000'
												step='100'
												value={simulationSpeed}
												onChange={e =>
													setSimulationSpeed(parseInt(e.target.value))
												}
												className='form-control'
											/>
											<span
												style={{
													fontSize: '0.75rem',
													color: '#718896',
													marginTop: '0.5rem',
													display: 'block',
												}}
											>
												{simulationSpeed} мс
											</span>
										</div>
									</div>
									<div className='controls-row'>
										{!isRunning ? (
											<button
												onClick={runSimulation}
												className='btn btn-success btn-full'
											>
												<Play size={16} />
												Запустить
											</button>
										) : (
											<button
												onClick={stopSimulation}
												className='btn btn-danger btn-full'
											>
												<Pause size={16} />
												Остановить
											</button>
										)}
										<button onClick={resetSimulation} className='btn btn-dark'>
											<RotateCcw size={16} />
										</button>
									</div>
									{operationsRef.current.length > 0 && (
										<div className='jump-controls'>
											<label style={{ fontSize: '0.875rem', color: '#718896' }}>
												Перемотка к строке:
											</label>
											<input
												type='number'
												min='1'
												max={operationsRef.current.length}
												className='jump-input'
												onChange={e => {
													const lineNum = parseInt(e.target.value) - 1
													if (!isNaN(lineNum)) jumpToLine(lineNum)
												}}
											/>
										</div>
									)}
								</div>
							</div>
							<div className='card'>
								<div className='card-body'>
									<h3
										style={{
											fontSize: '1.125rem',
											fontWeight: '700',
											marginBottom: '1rem',
											color: '#2D2D2D',
										}}
									>
										Визуализация
									</h3>
									<div className='canvas-container'>
										<canvas
											ref={canvasRef}
											width={600}
											height={400}
											className='canvas-element'
										/>
										{toolOutOfBounds && (
											<div className='out-of-bounds-warning'>
												<AlertTriangle size={16} />
												Инструмент выходит за границы материала!
											</div>
										)}
									</div>
									<div className='canvas-info'>
										<p>
											• Серый круг/прямоугольник: текущее положение инструмента
										</p>
										<p>• Полупрозрачная фигура: зона резки инструмента</p>
										<p>
											• Красный цвет: инструмент выходит за границы материала
										</p>
										<p>• Черные фигуры: пробитые отверстия</p>
										<p>
											• Размеры: {materialSize.width} × {materialSize.height} мм
										</p>
									</div>
								</div>
							</div>
						</div>
						<div className='tools-panel'>
							<div className='tools-header'>
								<div className='card-title'>
									<Wrench size={20} />
									Библиотека инструментов
								</div>
							</div>
							<div className='tools-content'>
								{Object.entries(toolCategories).map(([category, tools]) => (
									<div key={category} className='tool-category'>
										<div className='tool-category-title'>{category}</div>
										{tools.map(tool => (
											<div key={tool.position} className='tool-item'>
												<div className='tool-info'>
													{usedTools.has(tool.position) ? (
														<CheckCircle size={16} className='tool-used' />
													) : (
														<Circle size={16} className='tool-not-used' />
													)}
													<span>
														T{tool.position.toString().padStart(2, '0')}
													</span>
													<span
														style={{
															marginLeft: '0.5rem',
															fontSize: '0.875rem',
															color: '#718896',
														}}
													>
														{tool.name}
													</span>
												</div>
												<span>
													{tool.diameter > 0
														? `${tool.diameter} мм`
														: `${tool.width}×${tool.height} мм`}
												</span>
											</div>
										))}
									</div>
								))}
							</div>
						</div>
					</div>
					<div className='report-panel'>
						<div className='report-header'>
							<div className='card-title'>
								<FileText size={20} />
								Отчет по обработке
							</div>
							{report && (
								<span style={{ fontSize: '0.875rem', color: '#718896' }}>
									{report.completionTime.toLocaleString('ru-RU')}
								</span>
							)}
						</div>
						<div className='report-content'>
							{!report ? (
								<div className='report-placeholder'>
									<Info size={24} style={{ marginBottom: '1rem' }} />
									<p>Отчет появится после завершения обработки детали</p>
								</div>
							) : (
								<div className='report-grid'>
									<div className='report-item'>
										<div className='report-label'>
											<Clock size={16} /> Общее время
										</div>
										<div className='report-value'>
											{report.totalTimeMin} мин ({report.totalTimeSec} сек)
										</div>
									</div>
									<div className='report-item'>
										<div className='report-label'>
											<Wrench size={16} /> Отверстий
										</div>
										<div className='report-value'>{report.holeCount}</div>
									</div>
									<div className='report-item'>
										<div className='report-label'>
											<BarChart3 size={16} /> Производительность
										</div>
										<div className='report-value'>
											{report.holesPerMinute} отв/мин
										</div>
									</div>
									<div className='report-item'>
										<div className='report-label'>
											<Ruler size={16} /> Перемещения
										</div>
										<div className='report-value'>
											{report.totalMoveDistance} мм
										</div>
									</div>
									<div className='report-item'>
										<div className='report-label'>
											<Percent size={16} /> Эффективность
										</div>
										<div className='report-value'>{report.efficiency}%</div>
									</div>
									<div className='report-item'>
										<div className='report-label'>
											<Calendar size={16} /> Дата завершения
										</div>
										<div className='report-value'>
											{report.completionTime.toLocaleDateString('ru-RU')}
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
					<div className='debug-panel'>
						<div
							className='debug-header'
							onClick={() => setShowDebugPanel(!showDebugPanel)}
						>
							<div className='card-title'>
								<Code size={20} />
								Панель отладки
							</div>
							{showDebugPanel ? (
								<Minimize2 size={16} />
							) : (
								<Maximize2 size={16} />
							)}
						</div>
						{showDebugPanel && (
							<div className='debug-content'>
								<div className='debug-coordinates'>
									<div className='coord-card'>
										<div className='coord-label'>Текущая X</div>
										<div className='coord-value'>
											{currentPosition.x.toFixed(1)}
										</div>
									</div>
									<div className='coord-card'>
										<div className='coord-label'>Текущая Y</div>
										<div className='coord-value'>
											{currentPosition.y.toFixed(1)}
										</div>
									</div>
									<div className='coord-card'>
										<div className='coord-label'>Инструмент</div>
										<div className='coord-value'>
											T{currentToolRef.current} (
											{toolLibrary[currentToolRef.current]?.name ||
												'Неизвестен'}
											)
										</div>
									</div>
									<div className='coord-card'>
										<div className='coord-label'>Отверстий</div>
										<div className='coord-value'>{holes.length}</div>
									</div>
								</div>
								<div>
									<h4
										style={{
											fontSize: '1rem',
											fontWeight: '600',
											marginBottom: '0.75rem',
										}}
									>
										Лог операций
									</h4>
									<div className='debug-log'>
										{debugLog.length > 0 ? (
											debugLog.map((entry, index) => (
												<div key={index} className='log-entry'>
													<div className='log-time'>{entry.timestamp}</div>
													<div className='log-details'>
														{entry.operation} (строка {entry.line})
														{entry.x && entry.y && `, X${entry.x}, Y${entry.y}`}
														{entry.diameter &&
															entry.diameter !== 'N/A' &&
															`, D${entry.diameter}`}
														{entry.toolName && ` - ${entry.toolName}`}
													</div>
												</div>
											))
										) : (
											<div style={{ color: '#718896', fontStyle: 'italic' }}>
												Лог пуст. Запустите симуляцию для просмотра операций.
											</div>
										)}
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	)
}

export default App
