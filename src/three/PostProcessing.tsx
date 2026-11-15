import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FilmGrainVignetteShader } from './shaders';

interface PostProcessingProps {
  isSoftwareGl: boolean;
  entryIntensity: number;
  isMissionStage: boolean;
}

export function PostProcessing({
  isSoftwareGl,
  entryIntensity,
  isMissionStage,
}: PostProcessingProps) {
  const { gl, scene, camera, size } = useThree();
  const entryTargetRef = useRef(entryIntensity);
  entryTargetRef.current = entryIntensity;

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    return () => {
      scene.environment = null;
      envTex.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  // Preserve harsh space terminator contrast while allowing metallic foil speculars in close-up
  useEffect(() => {
    scene.environmentIntensity = isMissionStage ? 0.22 : 0.015;
  }, [scene, isMissionStage]);

  const composerData = useMemo(() => {
    if (isSoftwareGl) return null;

    const composer = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Restrained optical halation strictly on highest specular glints (never halos planets)
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(Math.max(1, size.width / 2), Math.max(1, size.height / 2)),
      0.11,
      0.22,
      0.97,
    );
    composer.addPass(bloomPass);

    const filmPass = new ShaderPass(FilmGrainVignetteShader);
    composer.addPass(filmPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    return { composer, bloomPass, filmPass };
  }, [gl, scene, camera, isSoftwareGl]);

  useEffect(() => {
    if (!composerData) return;
    composerData.composer.setSize(size.width, size.height);
    composerData.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    composerData.bloomPass.resolution.set(
      Math.max(1, size.width / 2),
      Math.max(1, size.height / 2),
    );
  }, [composerData, size]);

  useEffect(() => {
    return () => {
      composerData?.composer.dispose();
    };
  }, [composerData]);

  useFrame((state, delta) => {
    if (!composerData) return;
    const u = composerData.filmPass.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uEntryIntensity.value = THREE.MathUtils.damp(
      u.uEntryIntensity.value,
      entryTargetRef.current,
      3.5,
      delta,
    );
    composerData.composer.render();
  }, 1);

  return null;
}
