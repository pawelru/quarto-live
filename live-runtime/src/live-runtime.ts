import * as WebR from 'webr';
import * as Comlink from 'comlink';
import type { PyodideInterfaceWorker, PyodideWorker } from './pyodide-worker';
import { WebRExerciseEditor, PyodideExerciseEditor } from './editor';
import { highlightR, highlightPython, interpolate } from './highlighter';
import { WebREvaluator } from './evaluate-webr';
import { PyodideEvaluator } from './evaluate-pyodide';
import { WebREnvironmentManager, PyodideEnvironmentManager } from './environment';
import { WebRGrader } from './grader-webr';
import { PyodideGrader } from './grader-pyodide';
import { comlinkTransfer, imageBitmapTransfer, mapTransfer, proxyTransfer } from './pyodide-proxy';

type WebRInitData = {
  packages: {
    pkgs: string[],
    repos: string[],
  }
  options: WebR.WebROptions,
  render_df: string;
}

async function setupR(webR: WebR.WebR, data: WebRInitData) {
  await webR.evalRVoid('options("webr.render.df" = x)', {
    env: { x: data.render_df || "default" },
  });
  return await webR.evalRVoid(atob(require('./assets/R/setup.R')));
}

async function setupPython(pyodide: PyodideInterfaceWorker) {
  await pyodide.runPythonAsync(atob(require('./assets/Python/setup.py')))
  const matplotlib_display = atob(require('./assets/Python/matplotlib_display.py'));
  await pyodide.FS.mkdir('/pyodide');
  await pyodide.FS.writeFile('/pyodide/matplotlib_display.py', matplotlib_display);
}

async function startPyodideWorker(options) {
  const workerUrl = new URL("./pyodide-worker.js", import.meta.url);
  const worker = new Worker(workerUrl, { type: "module" });
  const pyodideWorker = Comlink.wrap<PyodideWorker>(worker);
  const pyodide = await pyodideWorker.init(options);
  Comlink.transferHandlers.set("PyProxy", proxyTransfer);
  Comlink.transferHandlers.set("Comlink", comlinkTransfer);
  Comlink.transferHandlers.set("ImageBitmap", imageBitmapTransfer);
  Comlink.transferHandlers.set("Map", mapTransfer);
  return pyodide;
}

declare global {
  interface Window {
    _exercise_ojs_runtime?: {
      PyodideExerciseEditor: typeof PyodideExerciseEditor;
      PyodideEvaluator: typeof PyodideEvaluator;
      PyodideEnvironmentManager: typeof PyodideEnvironmentManager;
      PyodideGrader: typeof PyodideGrader;
      WebR: typeof WebR;
      WebRExerciseEditor: typeof WebRExerciseEditor;
      WebREvaluator: typeof WebREvaluator;
      WebRGrader: typeof WebRGrader;
      WebREnvironmentManager: typeof WebREnvironmentManager;
      highlightR: typeof highlightR;
      highlightPython: typeof highlightPython;
      interpolate: typeof interpolate;
      setupR: typeof setupR;
      setupPython: typeof setupPython;
      startPyodideWorker: typeof startPyodideWorker;
    };
  }
}

window._exercise_ojs_runtime = {
  PyodideExerciseEditor,
  PyodideEvaluator,
  PyodideEnvironmentManager,
  PyodideGrader,
  WebR,
  WebRExerciseEditor,
  WebREvaluator,
  WebRGrader,
  WebREnvironmentManager,
  highlightR,
  highlightPython,
  interpolate,
  setupR,
  setupPython,
  startPyodideWorker,
};

export {
  PyodideExerciseEditor,
  PyodideEvaluator,
  PyodideEnvironmentManager,
  PyodideGrader,
  WebR,
  WebRExerciseEditor,
  WebREvaluator,
  WebRGrader,
  WebREnvironmentManager,
  highlightR,
  highlightPython,
  interpolate,
  setupR,
  setupPython,
  startPyodideWorker,
}