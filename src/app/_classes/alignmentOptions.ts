export type AlignmentOptions = {
  alignment: "left" | "right" | "center";
  padding: number;
  scale: {
    x: "auto" | number;
    y: "auto" | number;
  } | "fit" | "cover" | "stretch";
}
