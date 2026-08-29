declare module "dom-to-image" {
  const domtoimage: {
    toPng(node: HTMLElement, options?: {
      width?: number;
      height?: number;
      bgcolor?: string;
      style?: Record<string, string>;
    }): Promise<string>;
  };

  export default domtoimage;
}
