import type { Matrix } from 'pixi.js-legacy';
import type { Matrix2D, Point } from '../types/skia';

export function fromPixiMatrix(matrix: Matrix): Matrix2D {
  return {
    a: matrix.a,
    b: matrix.b,
    c: matrix.c,
    d: matrix.d,
    tx: matrix.tx,
    ty: matrix.ty,
  };
}

export function invertMatrix(matrix: Matrix2D): Matrix2D | null {
  const det = matrix.a * matrix.d - matrix.b * matrix.c;
  if (Math.abs(det) < 0.000001) return null;

  return {
    a: matrix.d / det,
    b: -matrix.b / det,
    c: -matrix.c / det,
    d: matrix.a / det,
    tx: (matrix.c * matrix.ty - matrix.d * matrix.tx) / det,
    ty: (matrix.b * matrix.tx - matrix.a * matrix.ty) / det,
  };
}

export function applyMatrix(matrix: Matrix2D, point: Point): Point {
  return {
    x: matrix.a * point.x + matrix.c * point.y + matrix.tx,
    y: matrix.b * point.x + matrix.d * point.y + matrix.ty,
  };
}
