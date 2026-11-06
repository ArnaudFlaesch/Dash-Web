import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject, signal } from "@angular/core";
import { MatButton } from "@angular/material/button";
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from "@angular/material/dialog";
import { ConfigService } from "@features/home/config-service";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";

@Component({
  selector: "dash-import-config-modal",
  templateUrl: "./import-config-modal.html",
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButton, MatDialogClose]
})
export class ImportConfigModal {
  protected readonly labels = {
    importConfig: "Importer la configuration",
    selectConfigFile: "Sélectionner un fichier de configuration",
    cancel: "Annuler",
    upload: "Upload"
  };

  private readonly ERROR_MESSAGES = {
    importConfiguration: "Erreur lors de l'import de la configuration."
  };

  protected readonly fileToUpload = signal<File | null>(null);

  private readonly configService = inject(ConfigService);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly dialogRef = inject<MatDialogRef<ImportConfigModal>>(MatDialogRef);

  protected selectFile(event: Event): void {
    // No file when the selection is cleared
    this.fileToUpload.set((event.target as HTMLInputElement).files?.[0] ?? null);
  }

  protected upload(): void {
    const file = this.fileToUpload();
    if (file) {
      this.configService.importConfig(file).subscribe({
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.importConfiguration),
        complete: () => {
          this.dialogRef.close();
          window.location.reload();
        }
      });
    }
  }
}
