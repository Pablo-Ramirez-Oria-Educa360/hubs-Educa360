function hasBehaviorGraph(object3D) {
  let hasGraph = !!object3D?.userData?.behaviorGraph;
  object3D?.traverse(obj => {
    if (obj.userData?.behaviorGraph) {
      hasGraph = true;
    }
  });
  return hasGraph;
}

export function addAnimationComponents(modelEl) {
  if (!modelEl.components["animation-mixer"]) {
    return;
  }

  // Behavior graph models should control animation playback themselves.
  if (hasBehaviorGraph(modelEl.object3D)) {
    return;
  }

  if (!modelEl.querySelector("[loop-animation]")) {
    modelEl.setAttribute("loop-animation", "");
  }
}
