import { Pipe, PipeTransform } from "@angular/core";
import * as path from "path";
@Pipe({
  name: "pathToSlideName",
})
export class PathToSlideNamePipe implements PipeTransform {

  public transform(value: string): string {
    return path.basename(value);
  }

}
