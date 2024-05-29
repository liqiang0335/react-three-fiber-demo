import { Canvas, MeshProps, useThree } from "@react-three/fiber";
import { Suspense, memo, useEffect } from "react";
import { useGLTF, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { color } from "d3-color";
import { create } from "zustand";
import { AddDispatch } from "./vite-env";
import { useReducerWrap } from "./hooks/useReducerWrap";

const baseColor = color("#707070")!;

interface Store {
  code: string;
  meshes: any[];
  rowNames: string;
  colNames: string;
}

const useStore = create<AddDispatch<Store>>()((set) => ({
  code: "",
  meshes: [],
  rowNames: "",
  colNames: "",
  dispatch: (data) => set(data),
}));

export default function App() {
  const store = useStore();
  return (
    <div id="canvas-container" className="w-[1200px] h-[600px] bg-gray-100">
      <Canvas>
        <Suspense fallback={null}>
          <MainScene></MainScene>
          <Environment preset="sunset" />
          <OrbitControls />
        </Suspense>
      </Canvas>
    </div>
  );
}

const CellMesh = () => {
  const store = useStore();
  return (
    <>
      {store.meshes.map((it, idx) => {
        return <mesh key={idx} {...it} />;
      })}
    </>
  );
};

export function CellScene() {
  const store = useStore();
  return (
    <div id="canvas-cell" className="w-[1200px] h-[300px] bg-gray-100 mt-2">
      <Canvas>
        <Suspense fallback={null}>
          <CellMesh></CellMesh>
          <Environment preset="sunset" />
          <OrbitControls />
        </Suspense>
      </Canvas>
      <div className="absolute right-5 top-5 font-bold">单元工程: {store.code}</div>
    </div>
  );
}

const MainScene = memo(() => {
  const store = useStore();
  const gltf = useGLTF("/models/dam-yf-01.glb");
  const { gl, camera, scene } = useThree();

  console.log("⭕️ gltf: ", gltf);
  useEffect(() => {
    // 添加点击事件监听器
    gl.domElement.addEventListener("click", (e) => onClickMesh(e, camera, scene, store));
  }, [gl, camera, scene]);

  // 获取所有的名称
  // [dam, row, col] :  ["dam-1-1", "dam-3-2", ]
  const cellNames = gltf.scene.children.map((it) => it.name.split("_")[0]);
  const maxRow = Math.max(...cellNames.map((it) => +it.split("-")[1])); // 查找 row 的最大值
  const maxCol = Math.max(...cellNames.map((it) => +it.split("-")[2])); // 查找 col 的最大值

  // 遍历所有的网格Mesh
  gltf.scene.traverse((child) => {
    if (child.type === "Mesh" && child instanceof THREE.Mesh) {
      // 判断是否是 dam 的网格
      const isOk = child.parent?.name && /^dam/.test(child.parent?.name);
      if (isOk) {
        // 获取单元格编号
        const [damCode] = child.parent!.name.split("_");
        const [_, row, col] = damCode.split("-");

        // 根据 row 和 col 的值，计算出颜色亮度, 亮度值范围 [0, 1]
        // 每个单元格的亮度值都不一样, 亮度值随着 row 和 col 的值递增
        const target = baseColor.brighter(+row / maxRow).brighter(+col / maxCol);
        const targetColorStr = target.toString();

        // 存储颜色值
        child.userData = { color: targetColorStr };

        // 设置材质
        child.material = new THREE.MeshStandardMaterial({ color: targetColorStr });
      }
    }
  });

  return <primitive object={gltf.scene} scale={0.05} />;
});

// 点击事件处理函数
function onClickMesh(event: MouseEvent, camera: THREE.Camera, scene: THREE.Scene, store: AddDispatch<Store>) {
  // 计算点击位置的归一化设备坐标
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // 发射一条射线
  raycaster.setFromCamera(mouse, camera);

  // 获取所有被射线相交的对象
  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    // 获取第一个相交的网格对象
    const clickedMesh = intersects[0].object;
    const parent = clickedMesh.parent;
    console.log("⭕️ parent: ", parent);
    if (parent) {
      const [damCode] = parent.name.split("_");
      store.dispatch({ meshes: parent.children, code: damCode.replace("dam-", "") });
    }
  } else {
    console.log("None intersects");
  }
}
