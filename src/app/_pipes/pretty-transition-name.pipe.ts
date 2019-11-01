import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "prettyTransitionName",
})
export class PrettyTransitionNamePipe implements PipeTransform {

  public transform(value: string): string {
    return value.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
  }

}
