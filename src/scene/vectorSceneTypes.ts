export type VectorSceneNode =
  | {
      type: 'container';
      label?: string;
      x?: number;
      y?: number;
      angle?: number;
      scaleX?: number;
      scaleY?: number;
      children: VectorSceneNode[];
    }
  | {
      type: 'ellipse';
      label: string;
      x: number;
      y: number;
      rx: number;
      ry: number;
      fill: string;
      angle?: number;
      scaleX?: number;
      scaleY?: number;
    }
  | {
      type: 'rect';
      label: string;
      x: number;
      y: number;
      rectX: number;
      rectY: number;
      width: number;
      height: number;
      fill: string;
      angle?: number;
      scaleX?: number;
      scaleY?: number;
    }
  | {
      type: 'line';
      label: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      stroke: string;
      strokeWidth: number;
      angle?: number;
      scaleX?: number;
      scaleY?: number;
    }
  | {
      type: 'sprite';
      label: string;
      x: number;
      y: number;
      width: number;
      height: number;
      angle?: number;
      scaleX?: number;
      scaleY?: number;
    };

export type VectorSceneDocument = {
  width: number;
  height: number;
  root: VectorSceneNode;
};
