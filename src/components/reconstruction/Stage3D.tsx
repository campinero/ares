import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { EVENT_STAGE, KIND_COLOR, STAGE_NODES, STAGE_NODE_BY_ID, type StageNode } from './stage'

/**
 * The reconstruction scene.
 *
 * Actors sit on a plane; the active event lights its participants and draws the
 * transfer between them. Nothing here is decorative - every pulse corresponds
 * to an event in the case file, and a denied transfer is drawn as a transfer
 * that stops at the boundary.
 */

interface Stage3DProps {
  activeEventId: string | null
  /** 0..1 progress through the active event beat, used to drive the transfer. */
  beatProgress: number
  playing: boolean
  onSelectNode: (nodeId: string) => void
  focusedNodes: string[]
}

export function Stage3D({ activeEventId, beatProgress, playing, onSelectNode, focusedNodes }: Stage3DProps) {
  const beat = activeEventId ? EVENT_STAGE[activeEventId] : undefined
  const active = new Set(beat?.active ?? [])
  const focused = new Set(focusedNodes)

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [6.4, 10.6, 16.2], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <color attach="background" args={['#05070b']} />
      <fog attach="fog" args={['#05070b', 18, 42]} />
      <ambientLight intensity={0.42} />
      <directionalLight position={[6, 12, 8]} intensity={0.6} color="#8fd7ff" />
      <pointLight position={[0, 5, 0]} intensity={22} distance={26} color="#33c9de" />

      <GridFloor />

      {STAGE_NODES.map((node) => (
        <StageMarker
          key={node.id}
          node={node}
          active={active.has(node.id)}
          dimmed={focused.size > 0 && !focused.has(node.id)}
          onSelect={() => onSelectNode(node.id)}
        />
      ))}

      {beat?.flow ? (
        <Transfer from={beat.flow[0]} to={beat.flow[1]} progress={beatProgress} denied={beat.denied ?? false} />
      ) : null}

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={11}
        maxDistance={34}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 2.35}
        autoRotate={playing}
        autoRotateSpeed={0.22}
      />
    </Canvas>
  )
}

function GridFloor() {
  const lines = useMemo(() => {
    const points: number[] = []
    const half = 12
    for (let i = -half; i <= half; i += 1.5) {
      points.push(-half, 0, i, half, 0, i)
      points.push(i, 0, -half, i, 0, half)
    }
    return new Float32Array(points)
  }, [])

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(lines, 3))
    return g
  }, [lines])

  return (
    <lineSegments geometry={geometry} position={[0, -0.62, 0]}>
      <lineBasicMaterial color="#12202c" transparent opacity={0.85} />
    </lineSegments>
  )
}

function StageMarker({
  node,
  active,
  dimmed,
  onSelect,
}: {
  node: StageNode
  active: boolean
  dimmed: boolean
  onSelect: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const color = KIND_COLOR[node.kind]

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (meshRef.current) {
      const target = active ? 1.28 : 1
      const current = meshRef.current.scale.x
      const next = current + (target - current) * 0.12
      meshRef.current.scale.setScalar(next)
      meshRef.current.position.y = active ? 0.16 + Math.sin(t * 2.2) * 0.05 : 0
    }
    if (ringRef.current) {
      const material = ringRef.current.material as THREE.MeshBasicMaterial
      if (active) {
        const phase = (t * 0.85) % 1
        ringRef.current.scale.setScalar(0.55 + phase * 2.2)
        material.opacity = 0.5 * (1 - phase)
      } else {
        material.opacity = 0
      }
    }
  })

  const opacity = dimmed ? 0.22 : 1

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onClick={(event) => {
          event.stopPropagation()
          onSelect()
        }}
      >
        <boxGeometry args={[0.92, 0.5, 0.92]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 1.5 : 0.35}
          metalness={0.35}
          roughness={0.32}
          transparent
          opacity={opacity}
        />
      </mesh>

      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <ringGeometry args={[0.62, 0.78, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, -0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.72, 32]} />
        <meshBasicMaterial color={color} transparent opacity={dimmed ? 0.04 : 0.1} />
      </mesh>

      <Html center distanceFactor={13} position={[0, 1.15, 0]} zIndexRange={[10, 0]}>
        <div
          className="pointer-events-none select-none text-center"
          style={{ opacity: dimmed ? 0.35 : 1, transition: 'opacity 200ms' }}
        >
          <div
            className="font-mono text-[11px] tracking-[0.08em] whitespace-nowrap"
            style={{ color: active ? color : '#a3b4c7' }}
          >
            {node.label}
          </div>
          <div className="text-[9px] tracking-[0.1em] whitespace-nowrap text-[#5c718a] uppercase">{node.sub}</div>
        </div>
      </Html>
    </group>
  )
}

function Transfer({
  from,
  to,
  progress,
  denied,
}: {
  from: string
  to: string
  progress: number
  denied: boolean
}) {
  const source = STAGE_NODE_BY_ID.get(from)
  const target = STAGE_NODE_BY_ID.get(to)
  const packetRef = useRef<THREE.Mesh>(null)

  const geometry = useMemo(() => {
    if (!source || !target) return null
    const a = new THREE.Vector3(...source.position)
    const b = new THREE.Vector3(...target.position)
    const mid = a.clone().add(b).multiplyScalar(0.5)
    mid.y += a.distanceTo(b) * 0.28 + 0.9
    return new THREE.QuadraticBezierCurve3(a, mid, b)
  }, [source, target])

  const tube = useMemo(() => (geometry ? new THREE.TubeGeometry(geometry, 48, 0.035, 8, false) : null), [geometry])

  useFrame(() => {
    if (!packetRef.current || !geometry) return
    // A denied transfer stops short of the destination and holds there.
    const travel = denied ? Math.min(progress, 0.62) : progress
    const point = geometry.getPoint(Math.max(0, Math.min(1, travel)))
    packetRef.current.position.copy(point)
    const material = packetRef.current.material as THREE.MeshStandardMaterial
    material.emissiveIntensity = denied && travel >= 0.6 ? 2.6 : 1.7
  })

  if (!tube || !geometry) return null
  const color = denied ? '#ef5340' : '#33c9de'

  return (
    <group>
      <mesh geometry={tube}>
        <meshBasicMaterial color={color} transparent opacity={denied ? 0.32 : 0.4} />
      </mesh>
      <mesh ref={packetRef}>
        <sphereGeometry args={[0.16, 20, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.7} />
      </mesh>
      {denied ? <DeniedMarker curve={geometry} /> : null}
    </group>
  )
}

function DeniedMarker({ curve }: { curve: THREE.QuadraticBezierCurve3 }) {
  const point = useMemo(() => curve.getPoint(0.62), [curve])
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    ref.current.rotation.z = t * 0.6
    const material = ref.current.material as THREE.MeshBasicMaterial
    material.opacity = 0.45 + Math.sin(t * 3.4) * 0.2
  })

  return (
    <mesh ref={ref} position={point}>
      <ringGeometry args={[0.28, 0.36, 6]} />
      <meshBasicMaterial color="#ef5340" transparent opacity={0.5} side={THREE.DoubleSide} />
    </mesh>
  )
}
