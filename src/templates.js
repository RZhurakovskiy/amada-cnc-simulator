// src/templates.js

/**
 * Шаблоны G-кода для симулятора КРП Amada
 * Каждый шаблон возвращает:
 * - gcode: текст программы
 * - width, height: размер материала
 * - toolDiameter: диаметр инструмента по умолчанию
 */

export const templates = {
	// 🌀 Круговая сетка
	circular_grid: {
		name: 'Круговая сетка',
		category: 'Окружности и дуги',
		generate: () => {
			const width = 400,
				height = 400
			const holeDiameter = 6
			let gcode = 'G90\n'
			const centerX = width / 2,
				centerY = height / 2
			const rings = 6,
				stepsPerRing = 12
			for (let r = 1; r <= rings; r++) {
				const radius = r * 30
				for (let i = 0; i < stepsPerRing; i++) {
					const angle = (i / stepsPerRing) * 2 * Math.PI
					const x = centerX + radius * Math.cos(angle)
					const y = centerY + radius * Math.sin(angle)
					gcode += `G00 X${x.toFixed(1)} Y${y.toFixed(1)}\n`
					gcode += `G81 X${x.toFixed(1)} Y${y.toFixed(1)} D${holeDiameter}.0\n`
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, holeDiameter }
		},
	},

	// 🔲 Равномерная сетка
	uniform_grid: {
		name: 'Равномерная сетка',
		category: 'Основные узоры',
		generate: () => {
			const width = 500,
				height = 300
			const holeDiameter = 8
			let gcode = 'G90\n'
			for (let y = 40; y <= height - 40; y += 40) {
				for (let x = 40; x <= width - 40; x += 40) {
					gcode += `G00 X${x}.0 Y${y}.0\n`
					gcode += `G81 X${x}.0 Y${y}.0 D${holeDiameter}.0\n`
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, holeDiameter }
		},
	},

	// ⚙️ Фланец с 8 отверстиями
	flange_8hole: {
		name: 'Фланец 8-отв',
		category: 'Промышленные детали',
		generate: () => {
			const width = 300,
				height = 300
			const holeDiameter = 10
			let gcode = 'G90\n'
			const centerX = 150,
				centerY = 150,
				radius = 80
			for (let i = 0; i < 8; i++) {
				const angle = (i / 8) * 2 * Math.PI
				const x = centerX + radius * Math.cos(angle)
				const y = centerY + radius * Math.sin(angle)
				gcode += `G00 X${x.toFixed(1)} Y${y.toFixed(1)}\n`
				gcode += `G81 X${x.toFixed(1)} Y${y.toFixed(1)} D${holeDiameter}.0\n`
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, holeDiameter }
		},
	},

	// 🔷 Диагональная решётка
	diagonal_grid: {
		name: 'Диагональная решётка',
		category: 'Узоры',
		generate: () => {
			const width = 600,
				height = 300
			const holeDiameter = 6
			let gcode = 'G90\n'
			for (let d = -width; d < height + width; d += 60) {
				for (let x = Math.max(d, 0); x < Math.min(d + height, width); x += 60) {
					const y = x - d
					if (y >= 0 && y <= height) {
						gcode += `G00 X${x}.0 Y${y}.0\n`
						gcode += `G81 X${x}.0 Y${y}.0 D${holeDiameter}.0\n`
					}
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, holeDiameter }
		},
	},

	// 🔲 Квадратная рамка
	square_frame: {
		name: 'Квадратная рамка',
		category: 'Контурные детали',
		generate: () => {
			const width = 400,
				height = 400
			const holeDiameter = 8
			let gcode = 'G90\n'
			const margin = 30,
				step = 40
			for (let x = margin; x <= width - margin; x += step) {
				gcode += `G00 X${x}.0 Y${margin}.0\nG81 X${x}.0 Y${margin}.0 D${holeDiameter}.0\n`
				gcode += `G00 X${x}.0 Y${height - margin}.0\nG81 X${x}.0 Y${
					height - margin
				}.0 D${holeDiameter}.0\n`
			}
			for (let y = margin + step; y <= height - margin - step; y += step) {
				gcode += `G00 X${margin}.0 Y${y}.0\nG81 X${margin}.0 Y${y}.0 D${holeDiameter}.0\n`
				gcode += `G00 X${width - margin}.0 Y${y}.0\nG81 X${
					width - margin
				}.0 Y${y}.0 D${holeDiameter}.0\n`
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, holeDiameter }
		},
	},

	// 🔺 Треугольная решётка
	triangular_grid: {
		name: 'Треугольная решётка',
		category: 'Узоры',
		generate: () => {
			const width = 600,
				height = 400
			const holeDiameter = 6
			let gcode = 'G90\n'
			const dx = 40,
				dy = 35
			for (let y = 0; y < height; y += dy * 2) {
				for (let x = 0; x < width; x += dx) {
					gcode += `G00 X${x}.0 Y${y}.0\nG81 X${x}.0 Y${y}.0 D${holeDiameter}.0\n`
					if (x + dx / 2 < width) {
						gcode += `G00 X${x + dx / 2}.0 Y${y + dy}.0\nG81 X${
							x + dx / 2
						}.0 Y${y + dy}.0 D${holeDiameter}.0\n`
					}
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, holeDiameter }
		},
	},

	// 🔷 Ромбовидная решётка
	diamond_grid: {
		name: 'Ромбовидная решётка',
		category: 'Узоры',
		generate: () => {
			const width = 500,
				height = 500
			const holeDiameter = 6
			let gcode = 'G90\n'
			const step = 60
			for (let y = 0; y < height; y += step) {
				for (let x = 0; x < width; x += step) {
					const offsetX = (y / step) % 2 === 0 ? 0 : step / 2
					const realX = x + offsetX
					if (realX < width) {
						gcode += `G00 X${realX}.0 Y${y}.0\nG81 X${realX}.0 Y${y}.0 D${holeDiameter}.0\n`
					}
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, holeDiameter }
		},
	},

	// 🔧 Пластина крепёжная 4x4
	mount_plate_4x4: {
		name: 'Крепёжная пластина 4x4',
		category: 'Промышленные детали',
		generate: () => {
			const width = 200,
				height = 200
			const holeDiameter = 8
			let gcode = 'G90\n'
			const margin = 30,
				step = 50
			for (let i = 0; i < 4; i++) {
				for (let j = 0; j < 4; j++) {
					const x = margin + i * step
					const y = margin + j * step
					gcode += `G00 X${x}.0 Y${y}.0\nG81 X${x}.0 Y${y}.0 D${holeDiameter}.0\n`
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, holeDiameter }
		},
	},

	// 🔄 Концентрические квадраты
	concentric_squares: {
		name: 'Конц. квадраты',
		category: 'Арт и дизайн',
		generate: () => {
			const width = 400,
				height = 400
			const holeDiameter = 5
			let gcode = 'G90\n'
			const center = 200,
				step = 40
			for (let s = 1; s <= 5; s++) {
				const size = s * step
				const left = center - size / 2,
					right = center + size / 2,
					top = left,
					bottom = right
				for (let x = left; x <= right; x += 20) {
					gcode += `G00 X${x}.0 Y${top}.0\nG81 X${x}.0 Y${top}.0 D${holeDiameter}.0\n`
					gcode += `G00 X${x}.0 Y${bottom}.0\nG81 X${x}.0 Y${bottom}.0 D${holeDiameter}.0\n`
				}
				for (let y = top + 20; y < bottom; y += 20) {
					gcode += `G00 X${left}.0 Y${y}.0\nG81 X${left}.0 Y${y}.0 D${holeDiameter}.0\n`
					gcode += `G00 X${right}.0 Y${y}.0\nG81 X${right}.0 Y${y}.0 D${holeDiameter}.0\n`
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, holeDiameter }
		},
	},

	// 🔴 Круг с отверстиями по диаметру
	circle_diameter_holes: {
		name: 'Круг, диаметр',
		category: 'Окружности и дуги',
		generate: () => {
			const width = 300,
				height = 300
			const holeDiameter = 6
			let gcode = 'G90\n'
			const cx = 150,
				cy = 150,
				r = 100
			for (let a = 0; a < 360; a += 15) {
				const rad = (a * Math.PI) / 180
				const x = cx + r * Math.cos(rad)
				const y = cy + r * Math.sin(rad)
				gcode += `G00 X${x.toFixed(1)} Y${y.toFixed(1)}\nG81 X${x.toFixed(
					1
				)} Y${y.toFixed(1)} D${holeDiameter}.0\n`
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, holeDiameter }
		},
	},

	// 🌀 Спираль Архимеда
	archimedes_spiral: {
		name: 'Спираль Архимеда',
		category: 'Арт и дизайн',
		generate: () => {
			const width = 400,
				height = 400
			const holeDiameter = 4
			let gcode = 'G90\n'
			const cx = 200,
				cy = 200
			for (let a = 0; a < 720; a += 20) {
				const rad = (a * Math.PI) / 180
				const r = a / 10
				const x = cx + r * Math.cos(rad)
				const y = cy + r * Math.sin(rad)
				gcode += `G00 X${x.toFixed(1)} Y${y.toFixed(1)}\nG81 X${x.toFixed(
					1
				)} Y${y.toFixed(1)} D${holeDiameter}.0\n`
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, holeDiameter }
		},
	},

	// 🔷 Шестиугольная решётка
	hex_grid: {
		name: 'Шестиугольная решётка',
		category: 'Узоры',
		generate: () => {
			const width = 600,
				height = 400
			const holeDiameter = 6
			let gcode = 'G90\n'
			const w = 40,
				h = Math.sin(Math.PI / 3) * w
			for (let row = 0; row < 10; row++) {
				for (let col = 0; col < 15; col++) {
					const even = row % 2 === 0
					const x = col * w * 1.5 + (even ? 0 : w * 0.75)
					const y = row * h
					gcode += `G00 X${x}.0 Y${y}.0\nG81 X${x}.0 Y${y}.0 D${holeDiameter}.0\n`
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, holeDiameter }
		},
	},

	// ⚙️ 12-отверстный фланец
	flange_12hole: {
		name: 'Фланец 12-отв',
		category: 'Промышленные детали',
		generate: () => {
			const width = 350,
				height = 350
			const holeDiameter = 10
			let gcode = 'G90\n'
			const cx = 175,
				cy = 175,
				r = 100
			for (let i = 0; i < 12; i++) {
				const a = (i / 12) * 2 * Math.PI
				const x = cx + r * Math.cos(a)
				const y = cy + r * Math.sin(a)
				gcode += `G00 X${x.toFixed(1)} Y${y.toFixed(1)}\nG81 X${x.toFixed(
					1
				)} Y${y.toFixed(1)} D${holeDiameter}.0\n`
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, holeDiameter }
		},
	},

	// 🔲 Крестообразная решётка
	cross_grid: {
		name: 'Крестообразная решётка',
		category: 'Узоры',
		generate: () => {
			const width = 400,
				height = 400
			const holeDiameter = 6
			let gcode = 'G90\n'
			for (let i = 50; i < width; i += 50) {
				gcode += `G00 X${i}.0 Y${200}.0\nG81 X${i}.0 Y${200}.0 D${holeDiameter}.0\n`
				gcode += `G00 X${200}.0 Y${i}.0\nG81 X${200}.0 Y${i}.0 D${holeDiameter}.0\n`
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, holeDiameter }
		},
	},

	// 🔼 Пирамидальная стопка
	pyramid_holes: {
		name: 'Пирамидальные отв.',
		category: 'Арт и дизайн',
		generate: () => {
			const width = 500,
				height = 300
			const holeDiameter = 8
			let gcode = 'G90\n'
			for (let row = 0; row < 10; row++) {
				const count = row + 1
				const totalWidth = (count - 1) * 60
				const startX = (width - totalWidth) / 2
				for (let i = 0; i < count; i++) {
					const x = startX + i * 60
					const y = 30 + row * 30
					gcode += `G00 X${x}.0 Y${y}.0\nG81 X${x}.0 Y${y}.0 D${holeDiameter}.0\n`
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, holeDiameter }
		},
	},

	// 🔘 Круг с центральным отверстием
	circle_centered: {
		name: 'Круг с центром',
		category: 'Окружности и дуги',
		generate: () => {
			const size = 300
			let gcode = 'G90\n'
			const cx = 150,
				cy = 150,
				r = 100
			for (let a = 0; a < 360; a += 30) {
				const rad = (a * Math.PI) / 180
				const x = cx + r * Math.cos(rad)
				const y = cy + r * Math.sin(rad)
				gcode += `G00 X${x.toFixed(1)} Y${y.toFixed(1)}\nG81 X${x.toFixed(
					1
				)} Y${y.toFixed(1)} D8.0\n`
			}
			gcode += `G00 X${cx}.0 Y${cy}.0\nG81 X${cx}.0 Y${cy}.0 D10.0\n`
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width: size, height: size, toolDiameter: 8 }
		},
	},

	// 🔳 Шахматная доска
	chess_holes: {
		name: 'Шахматные отв.',
		category: 'Узоры',
		generate: () => {
			const width = 400,
				height = 400
			const holeDiameter = 6
			let gcode = 'G90\n'
			const cell = 50
			for (let y = 0; y < height; y += cell) {
				for (let x = 0; x < width; x += cell) {
					if ((x / cell + y / cell) % 2 === 0) {
						gcode += `G00 X${x + cell / 2}.0 Y${y + cell / 2}.0\nG81 X${
							x + cell / 2
						}.0 Y${y + cell / 2}.0 D${holeDiameter}.0\n`
					}
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, holeDiameter }
		},
	},

	// 🌀 Двойная спираль
	double_spiral: {
		name: 'Двойная спираль',
		category: 'Арт и дизайн',
		generate: () => {
			const width = 400,
				height = 400
			let gcode = 'G90\n'
			const cx = 200,
				cy = 200
			for (let a = 0; a < 1080; a += 30) {
				const r = a / 15
				const rad = (a * Math.PI) / 180
				const x = cx + r * Math.cos(rad)
				const y = cy + r * Math.sin(rad)
				gcode += `G00 X${x.toFixed(1)} Y${y.toFixed(1)}\nG81 X${x.toFixed(
					1
				)} Y${y.toFixed(1)} D4.0\n`
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, toolDiameter: 4 }
		},
	},

	// 🔲 Квадрат с отверстиями по углам
	corner_square: {
		name: 'Квадрат углы',
		category: 'Контурные детали',
		generate: () => {
			const size = 300
			let gcode = 'G90\n'
			const margin = 30
			const corners = [
				[margin, margin],
				[size - margin, margin],
				[size - margin, size - margin],
				[margin, size - margin],
			]
			corners.forEach(([x, y]) => {
				gcode += `G00 X${x}.0 Y${y}.0\nG81 X${x}.0 Y${y}.0 D10.0\n`
			})
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width: size, height: size, toolDiameter: 10 }
		},
	},

	// 🔷 Ромб с внутренними отверстиями
	rhombus_grid: {
		name: 'Ромб с отв.',
		category: 'Узоры',
		generate: () => {
			const size = 400
			let gcode = 'G90\n'
			const center = size / 2
			const step = 40
			for (let d = -size; d <= size; d += step * 2) {
				for (let x = 0; x <= size; x += step) {
					const y = x - d
					const dx = x - center
					const dy = y - center
					if (Math.abs(dx) + Math.abs(dy) <= 150) {
						const finalX = center + dx
						const finalY = center + dy
						if (
							finalX >= 0 &&
							finalX <= size &&
							finalY >= 0 &&
							finalY <= size
						) {
							gcode += `G00 X${finalX}.0 Y${finalY}.0\nG81 X${finalX}.0 Y${finalY}.0 D6.0\n`
						}
					}
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width: size, height: size, toolDiameter: 6 }
		},
	},

	// ⚙️ Пластина с отверстиями под радиатор
	radiator_plate: {
		name: 'Радиаторная плата',
		category: 'Промышленные детали',
		generate: () => {
			const width = 300,
				height = 200
			let gcode = 'G90\n'
			for (let y = 30; y < height; y += 40) {
				for (let x = 30; x < width; x += 40) {
					if ((x / 40 + y / 40) % 2 === 0) continue
					gcode += `G00 X${x}.0 Y${y}.0\nG81 X${x}.0 Y${y}.0 D5.0\n`
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, toolDiameter: 5 }
		},
	},

	// 🔲 Рамка с угловыми отверстиями
	frame_corners: {
		name: 'Рамка + углы',
		category: 'Контурные детали',
		generate: () => {
			const width = 500,
				height = 300
			let gcode = 'G90\n'
			const m = 40
			for (let x = m; x <= width - m; x += 60) {
				gcode += `G00 X${x}.0 Y${m}.0\nG81 X${x}.0 Y${m}.0 D6.0\n`
				gcode += `G00 X${x}.0 Y${height - m}.0\nG81 X${x}.0 Y${
					height - m
				}.0 D6.0\n`
			}
			for (let y = m + 60; y <= height - m - 60; y += 60) {
				gcode += `G00 X${m}.0 Y${y}.0\nG81 X${m}.0 Y${y}.0 D6.0\n`
				gcode += `G00 X${width - m}.0 Y${y}.0\nG81 X${
					width - m
				}.0 Y${y}.0 D6.0\n`
			}
			;[
				[m, m],
				[width - m, m],
				[width - m, height - m],
				[m, height - m],
			].forEach(([x, y]) => {
				gcode += `G00 X${x}.0 Y${y}.0\nG81 X${x}.0 Y${y}.0 D8.0\n`
			})
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, toolDiameter: 8 }
		},
	},

	// 🔺 Треугольник с отверстиями
	triangle_holes: {
		name: 'Треугольник',
		category: 'Геометрические формы',
		generate: () => {
			const size = 400
			let gcode = 'G90\n'
			const h = (size * Math.sqrt(3)) / 2
			const p1 = [size / 2, 0]
			const p2 = [0, h]
			const p3 = [size, h]

			const drawLine = (x1, y1, x2, y2) => {
				for (let t = 0; t <= 1; t += 0.05) {
					const x = x1 + t * (x2 - x1)
					const y = y1 + t * (y2 - y1)
					gcode += `G00 X${x.toFixed(1)} Y${y.toFixed(1)}\nG81 X${x.toFixed(
						1
					)} Y${y.toFixed(1)} D5.0\n`
				}
			}

			drawLine(p1[0], p1[1], p2[0], p2[1])
			drawLine(p2[0], p2[1], p3[0], p3[1])
			drawLine(p3[0], p3[1], p1[0], p1[1])

			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width: size, height: size, toolDiameter: 5 }
		},
	},

	// 🌀 Концентрические окружности
	concentric_circles: {
		name: 'Конц. окружности',
		category: 'Окружности и дуги',
		generate: () => {
			const size = 400
			let gcode = 'G90\n'
			const cx = 200,
				cy = 200
			for (let r = 30; r <= 180; r += 30) {
				for (let a = 0; a < 360; a += 20) {
					const rad = (a * Math.PI) / 180
					const x = cx + r * Math.cos(rad)
					const y = cy + r * Math.sin(rad)
					gcode += `G00 X${x.toFixed(1)} Y${y.toFixed(1)}\nG81 X${x.toFixed(
						1
					)} Y${y.toFixed(1)} D4.0\n`
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width: size, height: size, toolDiameter: 4 }
		},
	},

	// 🔲 Квадрат 5x5
	square_5x5: {
		name: 'Квадрат 5x5',
		category: 'Промышленные детали',
		generate: () => {
			const size = 250
			let gcode = 'G90\n'
			const margin = 40,
				step = 50
			for (let i = 0; i < 5; i++) {
				for (let j = 0; j < 5; j++) {
					const x = margin + i * step
					const y = margin + j * step
					gcode += `G00 X${x}.0 Y${y}.0\nG81 X${x}.0 Y${y}.0 D8.0\n`
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width: size, height: size, toolDiameter: 8 }
		},
	},

	// 🔷 Ромб из точек
	diamond_points: {
		name: 'Ромб из точек',
		category: 'Геометрические формы',
		generate: () => {
			const size = 400
			let gcode = 'G90\n'
			const center = size / 2
			for (let d = -100; d <= 100; d += 20) {
				const x1 = center + d
				const y1 = center - 100 + Math.abs(d)
				const x2 = center + d
				const y2 = center + 100 - Math.abs(d)
				gcode += `G00 X${x1}.0 Y${y1}.0\nG81 X${x1}.0 Y${y1}.0 D6.0\n`
				if (y1 !== y2) {
					gcode += `G00 X${x2}.0 Y${y2}.0\nG81 X${x2}.0 Y${y2}.0 D6.0\n`
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width: size, height: size, toolDiameter: 6 }
		},
	},

	// 🔧 Промышленная панель 6x2
	industrial_panel: {
		name: 'Панель 6x2',
		category: 'Промышленные детали',
		generate: () => {
			const width = 600,
				height = 200
			let gcode = 'G90\n'
			const mx = 80,
				my = 80,
				step = 100
			for (let i = 0; i < 6; i++) {
				for (let j = 0; j < 2; j++) {
					const x = mx + i * step
					const y = my + j * 40
					gcode += `G00 X${x}.0 Y${y}.0\nG81 X${x}.0 Y${y}.0 D10.0\n`
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, toolDiameter: 10 }
		},
	},

	// 🌀 Волнистая решётка
	wave_grid: {
		name: 'Волнистая решётка',
		category: 'Арт и дизайн',
		generate: () => {
			const width = 600,
				height = 300
			let gcode = 'G90\n'
			for (let y = 0; y < height; y += 40) {
				for (let x = 0; x < width; x += 60) {
					const offsetY = Math.sin(x / 50) * 30
					const finalY = y + offsetY
					if (finalY >= 0 && finalY <= height) {
						gcode += `G00 X${x}.0 Y${finalY.toFixed(
							1
						)}\nG81 X${x}.0 Y${finalY.toFixed(1)} D5.0\n`
					}
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, toolDiameter: 5 }
		},
	},

	// 🔳 Плитка с отверстиями в шахматном порядке (малая)
	chess_tile: {
		name: 'Шахматная плитка',
		category: 'Узоры',
		generate: () => {
			const size = 100
			let gcode = 'G90\n'
			const cell = 25
			for (let y = 0; y < 4; y++) {
				for (let x = 0; x < 4; x++) {
					if ((x + y) % 2 === 0) {
						const posX = x * cell + cell / 2
						const posY = y * cell + cell / 2
						gcode += `G00 X${posX}.0 Y${posY}.0\nG81 X${posX}.0 Y${posY}.0 D4.0\n`
					}
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width: size, height: size, toolDiameter: 4 }
		},
	},

	// 🔲 Квадрат 3x3
	square_3x3: {
		name: 'Квадрат 3x3',
		category: 'Промышленные детали',
		generate: () => {
			const size = 150
			let gcode = 'G90\n'
			const margin = 30,
				step = 60
			for (let i = 0; i < 3; i++) {
				for (let j = 0; j < 3; j++) {
					const x = margin + i * step
					const y = margin + j * step
					gcode += `G00 X${x}.0 Y${y}.0\nG81 X${x}.0 Y${y}.0 D8.0\n`
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width: size, height: size, toolDiameter: 8 }
		},
	},

	// 🌀 Спираль с шагом по радиусу
	radial_spiral: {
		name: 'Радиальная спираль',
		category: 'Арт и дизайн',
		generate: () => {
			const size = 400
			let gcode = 'G90\n'
			const cx = 200,
				cy = 200
			for (let r = 20; r < 180; r += 10) {
				for (let a = 0; a < 360; a += 45) {
					const rad = (a * Math.PI) / 180
					const x = cx + r * Math.cos(rad)
					const y = cy + r * Math.sin(rad)
					gcode += `G00 X${x.toFixed(1)} Y${y.toFixed(1)}\nG81 X${x.toFixed(
						1
					)} Y${y.toFixed(1)} D5.0\n`
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width: size, height: size, toolDiameter: 5 }
		},
	},

	// 🔷 Звезда с 6 лучами
	star_6point: {
		name: 'Звезда 6-луч',
		category: 'Арт и дизайн',
		generate: () => {
			const size = 400
			let gcode = 'G90\n'
			const cx = 200,
				cy = 200
			for (let i = 0; i < 6; i++) {
				const angle = (i * 60 * Math.PI) / 180
				const x1 = cx + 150 * Math.cos(angle)
				const y1 = cy + 150 * Math.sin(angle)
				const x2 = cx + 80 * Math.cos(angle + Math.PI / 6)
				const y2 = cy + 80 * Math.sin(angle + Math.PI / 6)
				gcode += `G00 X${x1}.0 Y${y1}.0\nG81 X${x1}.0 Y${y1}.0 D6.0\n`
				gcode += `G00 X${x2}.0 Y${y2}.0\nG81 X${x2}.0 Y${y2}.0 D6.0\n`
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width: size, height: size, toolDiameter: 6 }
		},
	},

	// 🔧 Простая рамка
	simple_frame: {
		name: 'Простая рамка',
		category: 'Контурные детали',
		generate: () => {
			const width = 400,
				height = 300
			let gcode = 'G90\n'
			const step = 50
			// Верхняя и нижняя
			for (let x = 50; x <= width - 50; x += step) {
				gcode += `G00 X${x}.0 Y50.0\nG81 X${x}.0 Y50.0 D8.0\n`
				gcode += `G00 X${x}.0 Y${height - 50}.0\nG81 X${x}.0 Y${
					height - 50
				}.0 D8.0\n`
			}
			// Левая и правая
			for (let y = 50 + step; y <= height - 50 - step; y += step) {
				gcode += `G00 X50.0 Y${y}.0\nG81 X50.0 Y${y}.0 D8.0\n`
				gcode += `G00 X${width - 50}.0 Y${y}.0\nG81 X${
					width - 50
				}.0 Y${y}.0 D8.0\n`
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width, height, toolDiameter: 8 }
		},
	},

	// ⚙️ Фланец 6 отверстий
	flange_6hole: {
		name: 'Фланец 6-отв',
		category: 'Промышленные детали',
		generate: () => {
			const size = 300
			let gcode = 'G90\n'
			const cx = 150,
				cy = 150,
				r = 100
			for (let i = 0; i < 6; i++) {
				const a = (i / 6) * 2 * Math.PI
				const x = cx + r * Math.cos(a)
				const y = cy + r * Math.sin(a)
				gcode += `G00 X${x.toFixed(1)} Y${y.toFixed(1)}\nG81 X${x.toFixed(
					1
				)} Y${y.toFixed(1)} D10.0\n`
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width: size, height: size, toolDiameter: 10 }
		},
	},

	// 🔲 Квадрат 4x4
	square_4x4: {
		name: 'Квадрат 4x4',
		category: 'Промышленные детали',
		generate: () => {
			const size = 200
			let gcode = 'G90\n'
			const margin = 40,
				step = 50
			for (let i = 0; i < 4; i++) {
				for (let j = 0; j < 4; j++) {
					const x = margin + i * step
					const y = margin + j * step
					gcode += `G00 X${x}.0 Y${y}.0\nG81 X${x}.0 Y${y}.0 D8.0\n`
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width: size, height: size, toolDiameter: 8 }
		},
	},

	// 🔷 Ромб 5x5
	rhombus_5x5: {
		name: 'Ромб 5x5',
		category: 'Геометрические формы',
		generate: () => {
			const size = 400
			let gcode = 'G90\n'
			const center = size / 2
			const step = 40
			for (let i = -2; i <= 2; i++) {
				for (let j = -2; j <= 2; j++) {
					if (Math.abs(i) + Math.abs(j) <= 2) {
						const x = center + j * step
						const y = center + i * step
						gcode += `G00 X${x}.0 Y${y}.0\nG81 X${x}.0 Y${y}.0 D6.0\n`
					}
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width: size, height: size, toolDiameter: 6 }
		},
	},

	triangle_3x3: {
		name: 'Треугольник 3x3',
		category: 'Геометрические формы',
		generate: () => {
			const size = 300
			let gcode = 'G90\n'
			const baseY = 250

			for (let row = 0; row < 3; row++) {
				const count = 3 - row
				const totalW = (count - 1) * 60
				const startX = (size - totalW) / 2
				for (let i = 0; i < count; i++) {
					const x = startX + i * 60
					const y = baseY - row * 100
					gcode += `G00 X${x}.0 Y${y}.0\nG81 X${x}.0 Y${y}.0 D8.0\n`
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width: size, height: size, toolDiameter: 8 }
		},
	},

	// 🌀 Спираль Ферма
	fermat_spiral: {
		name: 'Спираль Ферма',
		category: 'Арт и дизайн',
		generate: () => {
			const size = 400
			let gcode = 'G90\n'
			const cx = 200,
				cy = 200
			for (let a = 0; a < 1440; a += 20) {
				const rad = (a * Math.PI) / 180
				const r = 10 * Math.sqrt(a)
				const x = cx + r * Math.cos(rad)
				const y = cy + r * Math.sin(rad)
				if (x >= 0 && x <= size && y >= 0 && y <= size) {
					gcode += `G00 X${x.toFixed(1)} Y${y.toFixed(1)}\nG81 X${x.toFixed(
						1
					)} Y${y.toFixed(1)} D4.0\n`
				}
			}
			gcode += `G00 X0.0 Y0.0\nM30`
			return { gcode, width: size, height: size, toolDiameter: 4 }
		},
	},
}

export default templates
