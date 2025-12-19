declare module 'recharts' {
  import { ComponentType, ReactNode } from 'react';

  export interface ChartProps {
    width?: number | string;
    height?: number | string;
    data?: any[];
    margin?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    children?: ReactNode;
  }

  export interface AxisProps {
    dataKey?: string;
    axisLine?: boolean;
    tickLine?: boolean;
    tick?: boolean | ComponentType<any>;
    tickFormatter?: (value: any) => string;
    tickCount?: number;
    domain?: [number | string | ((dataMin: number) => number), number | string | ((dataMax: number) => number)];
    type?: 'number' | 'category';
    allowDataOverflow?: boolean;
    allowDuplicatedCategory?: boolean;
    allowDecimals?: boolean;
    allowTicks?: boolean;
    tickSize?: number;
    tickMargin?: number;
    interval?: number | 'preserveStart' | 'preserveEnd' | 'preserveStartEnd';
    angle?: number;
    orientation?: 'left' | 'right' | 'middle' | 'top' | 'bottom';
    yAxisId?: string | number;
    xAxisId?: string | number;
    scale?: 'auto' | 'linear' | 'pow' | 'sqrt' | 'log' | 'identity' | 'time' | 'band' | 'point' | 'ordinal' | 'quantile' | 'quantize' | 'utc' | 'sequential' | 'threshold';
    unit?: string | number;
    name?: string | number;
    tickCount?: number;
    minTickGap?: number;
    pointerEvents?: string;
    label?: string | number | ReactNode | ComponentType<any>;
    scaleToFit?: boolean;
    tickCoord?: number;
    index?: number;
    isComposing?: boolean;
    cx?: number;
    cy?: number;
    radius?: number;
    innerRadius?: number;
    outerRadius?: number;
    clockWise?: boolean;
    startAngle?: number;
    endAngle?: number;
    reversed?: boolean;
    bottom?: ReactNode;
    top?: ReactNode;
    left?: ReactNode;
    right?: ReactNode;
    center?: [number, number];
    horizontal?: boolean;
    percent?: number;
    value?: number;
    mask?: string;
    text?: string | number;
    textAnchor?: string;
    verticalAnchor?: string;
    orientationHorizontal?: boolean;
    viewBox?: {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    };
    clockWise?: boolean;
    id?: string;
    styles?: any;
    animationBegin?: number;
    animationDuration?: number;
    isAnimationActive?: boolean;
    animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | 'spring' | 'cubicBezier';
    points?: Array<{
      x?: number;
      y?: number;
      value?: number;
    }>;
    shape?: ComponentType<any> | ReactNode;
    className?: string;
    dx?: number;
    dy?: number;
    strokeDasharray?: string;
    stroke?: string;
    fill?: string;
    fillOpacity?: number;
    strokeOpacity?: number;
  }

  export interface TooltipProps {
    active?: boolean;
    coordinate?: {
      x?: number;
      y?: number;
    };
    cursor?: boolean | ComponentType<any> | ReactNode;
    itemStyle?: any;
    content?: ComponentType<any> | ReactNode;
    separator?: string;
    offset?: number;
    filterNull?: boolean;
    itemSorter?: (item: any) => number;
    position?: {
      x?: number;
      y?: number;
    };
    viewBox?: {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    };
    labelFormatter?: (label: any, payload: any[]) => ReactNode;
    labelStyle?: any;
    wrapperStyle?: any;
    contentStyle?: any;
    labelClassName?: string;
    contentClassName?: string;
    cursorStyle?: any;
    isAnimationActive?: boolean;
    animationDuration?: number;
    animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | 'spring' | 'cubicBezier';
    animationBegin?: number;
    itemIcon?: ComponentType<any> | ReactNode;
    payload?: any[];
    payloadSettings?: any[];
    globalSettings?: any;
    activeLabel?: string;
    activePayload?: any[];
    coordinate2?: {
      x?: number;
      y?: number;
    };
  }

  export interface LegendProps {
    content?: ComponentType<any> | ReactNode;
    wrapperStyle?: any;
    chartWidth?: number;
    chartHeight?: number;
    iconSize?: number;
    iconType?: 'line' | 'plainline' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye';
    layout?: 'horizontal' | 'vertical';
    align?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    margin?: {
      top?: number;
      left?: number;
      bottom?: number;
      right?: number;
    };
    payload?: any[];
    formatter?: (value: any, entry: any, index: number) => ReactNode;
    formatter2?: (value: any, name: string) => ReactNode;
    itemStyle?: any;
    itemWidth?: number;
    itemHeight?: number;
    isAnimationActive?: boolean;
    animationDuration?: number;
    animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | 'spring' | 'cubicBezier';
    animationBegin?: number;
  }

  export interface ResponsiveContainerProps {
    aspect?: number;
    width?: string | number;
    height?: string | number;
    minHeight?: number;
    maxHeight?: number;
    minWidth?: number;
    maxWidth?: number;
    debounce?: number;
    children?: ReactNode;
    onResize?: (width?: number, height?: number) => void;
    mediaQuery?: boolean;
    resizeEnabled?: boolean;
    resizeThrottle?: number;
  }

  export interface LineProps {
    type?: 'basis' | 'basisClosed' | 'basisOpen' | 'linear' | 'linearClosed' | 'natural' | 'monotoneX' | 'monotoneY' | 'monotone' | 'step' | 'stepBefore' | 'stepAfter';
    dataKey?: string | number;
    xAxisId?: string | number;
    yAxisId?: string | number;
    legendType?: 'line' | 'plainline' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye';
    connectNulls?: boolean;
    dot?: boolean | ComponentType<any> | ReactNode;
    activeDot?: boolean | ComponentType<any> | ReactNode;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    fillOpacity?: number;
    strokeOpacity?: number;
    strokeDasharray?: string | number;
    fillRule?: 'nonzero' | 'evenodd';
    isAnimationActive?: boolean;
    animationBegin?: number;
    animationDuration?: number;
    animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | 'spring' | 'cubicBezier';
    points?: Array<{
      x?: number;
      y?: number;
      value?: number;
    }>;
    layout?: 'horizontal' | 'vertical';
    connectEnds?: boolean;
    curve?: ComponentType<any>;
    angleAxisId?: string | number;
    radiusAxisId?: string | number;
    hide?: boolean;
    label?: string | number | ReactNode | ComponentType<any>;
    name?: string | number;
    unit?: string | number;
    legendType?: 'line' | 'plainline' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye';
    maxBarSize?: number;
    minBarSize?: number;
    stackId?: string;
    hideNegativeValue?: boolean;
    hideZeroValue?: boolean;
    className?: string;
    shape?: ComponentType<any> | ReactNode;
    cx?: number;
    cy?: number;
    startAngle?: number;
    endAngle?: number;
    cornerRadius?: number | ((entry: any, index: number) => number);
    innerRadius?: number | ((entry: any, index: number) => number);
    outerRadius?: number | ((entry: any, index: number) => number);
    cornerIsExternal?: boolean;
  }

  export interface BarProps extends LineProps {
    cornerRadius?: number | ((entry: any, index: number) => number);
    minBarSize?: number;
    maxBarSize?: number;
    layout?: 'horizontal' | 'vertical';
    stackId?: string;
    hideNegativeValue?: boolean;
    hideZeroValue?: boolean;
  }

  export interface AreaProps extends LineProps {
    baseLine?: number | ((entry: any, index: number) => number);
    fill?: string;
    fillOpacity?: number;
    fillRule?: 'nonzero' | 'evenodd';
  }

  export interface PieProps {
    data?: any[];
    dataKey?: string | number;
    cx?: number | string;
    cy?: number | string;
    innerRadius?: number | string;
    outerRadius?: number | string;
    cornerRadius?: number;
    fill?: string;
    startAngle?: number;
    endAngle?: number;
    paddingAngle?: number;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string | number;
    strokeOpacity?: number;
    fillOpacity?: number;
    fillRule?: 'nonzero' | 'evenodd';
    isAnimationActive?: boolean;
    animationBegin?: number;
    animationDuration?: number;
    animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | 'spring' | 'cubicBezier';
    nameKey?: string;
    valueKey?: string;
    legendType?: 'line' | 'plainline' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye';
    minAngle?: number;
    background?: boolean | ComponentType<any> | ReactNode;
    children?: ReactNode;
    className?: string;
    id?: string;
    layout?: 'horizontal' | 'vertical';
    stackId?: string;
    hideNegativeValue?: boolean;
    hideZeroValue?: boolean;
    data?: any[];
    label?: boolean | ComponentType<any> | ReactNode | ((entry: any) => ReactNode);
    labelLine?: boolean | ComponentType<any> | ReactNode;
    name?: string | number;
    unit?: string | number;
    tooltipFormatter?: (value: any, name: string, props: any) => ReactNode;
    tooltipPosition?: {
      x?: number;
      y?: number;
    };
    tooltipType?: 'none' | 'schema' | 'ordinal' | 'quantitative';
    tooltipUnit?: number;
    showLabel?: boolean;
    showZero?: boolean;
    center?: [number, number];
    percent?: number;
    value?: number;
    mask?: string;
    clockWise?: boolean;
    maxBarSize?: number;
    minBarSize?: number;
    stackId?: string;
  }

  export interface CellProps {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string | number;
    strokeOpacity?: number;
    fillOpacity?: number;
    fillRule?: 'nonzero' | 'evenodd';
    className?: string;
  }

  export const ResponsiveContainer: ComponentType<ResponsiveContainerProps>;
  export const LineChart: ComponentType<ChartProps>;
  export const BarChart: ComponentType<ChartProps>;
  export const AreaChart: ComponentType<ChartProps>;
  export const PieChart: ComponentType<ChartProps>;
  export const XAxis: ComponentType<AxisProps>;
  export const YAxis: ComponentType<AxisProps>;
  export const CartesianGrid: ComponentType<AxisProps>;
  export const Tooltip: ComponentType<TooltipProps>;
  export const Legend: ComponentType<LegendProps>;
  export const Line: ComponentType<LineProps>;
  export const Bar: ComponentType<BarProps>;
  export const Area: ComponentType<AreaProps>;
  export const Pie: ComponentType<PieProps>;
  export const Cell: ComponentType<CellProps>;
}