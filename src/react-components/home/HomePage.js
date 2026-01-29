import React, { useContext, useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGamepad } from "@fortawesome/free-solid-svg-icons/faGamepad";
import { faMousePointer } from "@fortawesome/free-solid-svg-icons/faMousePointer";
import { faUsers } from "@fortawesome/free-solid-svg-icons/faUsers";
import { faVrCardboard } from "@fortawesome/free-solid-svg-icons/faVrCardboard";
import configs from "../../utils/configs";
import { CreateRoomButton } from "./CreateRoomButton";
import { PWAButton } from "./PWAButton";
import { useFavoriteRooms } from "./useFavoriteRooms";
import { usePublicRooms } from "./usePublicRooms";
import styles from "./HomePage.scss";
import { AuthContext } from "../auth/AuthContext";
import { createAndRedirectToNewHub } from "../../utils/phoenix-utils";
import { MediaGrid } from "../room/MediaGrid";
import { MediaTile } from "../room/MediaTiles";
import { PageContainer } from "../layout/PageContainer";
import { scaledThumbnailUrlFor } from "../../utils/media-url-utils";
import { Column } from "../layout/Column";
import { Container } from "../layout/Container";

export function HomePage() {
  const auth = useContext(AuthContext);
  const intl = useIntl();

  const { results: favoriteRooms } = useFavoriteRooms();
  const { results: publicRooms } = usePublicRooms();

  const sortedFavoriteRooms = Array.from(favoriteRooms).sort((a, b) => b.member_count - a.member_count);
  const sortedPublicRooms = Array.from(publicRooms).sort((a, b) => b.member_count - a.member_count);
  useEffect(() => {
    const qs = new URLSearchParams(location.search);

    // Support legacy sign in urls.
    if (qs.has("sign_in")) {
      const redirectUrl = new URL("/signin", window.location);
      redirectUrl.search = location.search;
      window.location = redirectUrl;
    } else if (qs.has("auth_topic")) {
      const redirectUrl = new URL("/verify", window.location);
      redirectUrl.search = location.search;
      window.location = redirectUrl;
    }

    if (qs.has("new")) {
      qs.delete("new");
      createAndRedirectToNewHub(null, null, true, qs);
    }
  }, []);

  const canCreateRooms = !configs.feature("disable_room_creation") || auth.isAdmin;
  return (
    <PageContainer className={styles.homePage}>
      <Container>
        <div className={styles.hero}>
          <div className={styles.heroImageCard}>
            <img
              alt={intl.formatMessage(
                {
                  id: "home-page.hero-image-alt",
                  defaultMessage: "Screenshot of {appName}"
                },
                { appName: configs.translation("app-name") }
              )}
              src={configs.image("home_background")}
            />
            <div className={styles.heroOverlay}>
              <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>
                  <span className={styles.heroTitleIntro}>
                    <FormattedMessage id="home-page.hero-intro" defaultMessage="El metaverso educativo:" />
                  </span>
                  <span className={styles.heroTitleMain}>{configs.translation("app-description")}</span>
                </h1>
                <div className={styles.heroActions}>
                  {canCreateRooms && <CreateRoomButton />}
                  <PWAButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
      <Container className={classNames(styles.featuresRow, styles.centerLg)}>
        <div className={styles.featureItem}>
          <FontAwesomeIcon className={styles.featureIcon} icon={faVrCardboard} />
          <span className={styles.featureLabel}>
            <FormattedMessage id="landing.feature.vr" defaultMessage="Virtual Reality" />
          </span>
        </div>
        <div className={styles.featureItem}>
          <FontAwesomeIcon className={styles.featureIcon} icon={faUsers} />
          <span className={styles.featureLabel}>
            <FormattedMessage id="landing.feature.collaboration" defaultMessage="Collaboration" />
          </span>
        </div>
        <div className={styles.featureItem}>
          <FontAwesomeIcon className={styles.featureIcon} icon={faGamepad} />
          <span className={styles.featureLabel}>
            <FormattedMessage id="landing.feature.gamification" defaultMessage="Gamification" />
          </span>
        </div>
        <div className={styles.featureItem}>
          <FontAwesomeIcon className={styles.featureIcon} icon={faMousePointer} />
          <span className={styles.featureLabel}>
            <FormattedMessage id="landing.feature.interactive" defaultMessage="Interactive Content" />
          </span>
        </div>
      </Container>
      {sortedPublicRooms.length > 0 && (
        <Container className={styles.roomsContainer}>
          <h3 className={styles.roomsHeading}>
            <FormattedMessage id="home-page.public--rooms" defaultMessage="Public Rooms" />
          </h3>
          <Column grow padding className={styles.rooms}>
            <MediaGrid center>
              {sortedPublicRooms.map(room => {
                return (
                  <MediaTile
                    key={room.id}
                    entry={room}
                    processThumbnailUrl={(entry, width, height) =>
                      scaledThumbnailUrlFor(entry.images.preview.url, width, height)
                    }
                  />
                );
              })}
            </MediaGrid>
          </Column>
        </Container>
      )}
      {sortedFavoriteRooms.length > 0 && (
        <Container className={styles.roomsContainer}>
          <h3 className={styles.roomsHeading}>
            <FormattedMessage id="home-page.favorite-rooms" defaultMessage="Favorite Rooms" />
          </h3>
          <Column grow padding className={styles.rooms}>
            <MediaGrid center>
              {sortedFavoriteRooms.map(room => {
                return (
                  <MediaTile
                    key={room.id}
                    entry={room}
                    processThumbnailUrl={(entry, width, height) =>
                      scaledThumbnailUrlFor(entry.images.preview.url, width, height)
                    }
                  />
                );
              })}
            </MediaGrid>
          </Column>
        </Container>
      )}
    </PageContainer>
  );
}
