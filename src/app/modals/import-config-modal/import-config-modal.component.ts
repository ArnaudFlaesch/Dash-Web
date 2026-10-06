import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { MatButton } from "@angular/material/button";
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from "@angular/material/dialog";
import { ConfigService } from "../../services/config.service/config.service";
import { ErrorHandlerService } from "../../services/error.handler.service";

@Component({
  selector: "dash-import-config-modal",
  templateUrl: "./import-config-modal.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButton, MatDialogClose]
})
export class ImportConfigModalComponent {
  public readonly fileToUpload = signal<File | null>(null);

  private readonly configService = inject(ConfigService);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly dialogRef = inject<MatDialogRef<ImportConfigModalComponent>>(MatDialogRef);

  private readonly ERROR_IMPORT_CONFIGURATION = "Erreur lors de l'import de la configuration.";

  public selectFile(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files?.[0]) {
      this.fileToUpload.set(target.files[0]);
    }
  }

  public upload(): void {
    const file = this.fileToUpload();
    if (file) {
      this.configService.importConfig(file).subscribe({
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_IMPORT_CONFIGURATION),
        complete: () => {
          this.dialogRef.close();
          window.location.reload();
        }
      });
    }
  }
}
