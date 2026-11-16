import { NgOptimizedImage } from "@angular/common";
import { Component, computed, input, output } from "@angular/core";
import {
  MatExpansionPanel,
  MatExpansionPanelContent,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "@angular/material/expansion";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatProgressBar } from "@angular/material/progress-bar";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { Achievement, GameInfoDisplay } from "../steam";

@Component({
  selector: "dash-game-details",
  templateUrl: "./game-details.html",
  styleUrl: "./game-details.scss",
  imports: [
    NgOptimizedImage,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelContent,
    MatButton,
    MatIcon,
    MatProgressBar,
    MatProgressSpinner
  ]
})
export class GameDetails {
  protected readonly labels = {
    gameIcon: "game icon",
    percent: "%",
    achievements: "Succès :",
    completedAchievements: "Succès complétés :",
    communityHub: "Community hub",
    noAchievements: "Aucun succès pour ce jeu."
  };

  public readonly gameInfo = input.required<GameInfoDisplay>();
  /** Achievements of the player for this game, undefined until they are loaded. */
  public readonly achievements = input<Achievement[] | undefined>(undefined);
  /** True while the achievements are loading. */
  public readonly isLoading = input(false);

  /** Emitted when the panel is opened, so that the achievements of the game are loaded. */
  public readonly achievementsRequested = output();

  public readonly achievementList = computed(() => this.achievements() ?? []);
  private readonly completedAchievements = computed(() =>
    this.achievementList().filter((achievement) => achievement.achieved === 1)
  );
  // Kept short so that the text stays on one line, without surrounding spaces
  public readonly completedCount = computed(() => this.completedAchievements().length);
  public readonly completionStatus = computed(() =>
    this.achievementList().length
      ? Math.floor((this.completedAchievements().length / this.achievementList().length) * 100)
      : undefined
  );
}
