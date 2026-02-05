import React, { useContext } from "react";
import PropTypes from "prop-types";
import { Page } from "./Page";
import { AuthContext } from "../auth/AuthContext";
import configs from "../../utils/configs";
import { useAccessibleOutlineStyle } from "../input/useAccessibleOutlineStyle";
import { isHmc } from "../../utils/isHmc";
import { TERMS, PRIVACY } from "../../constants";

export function PageContainer({ children, ...rest }) {
  const auth = useContext(AuthContext);
  useAccessibleOutlineStyle();
  const avatarMakerOrigin = "https://avatar-maker.educa360.es";

  const openAvatarMaker = () => {
    const win = window.open(avatarMakerOrigin, "_blank", "noopener");
    if (!win) return;

    const nonce = Math.random().toString(36).slice(2);
    const payload = {
      type: "HUBS_AUTH",
      version: 1,
      token: auth.token,
      userId: auth.userId,
      origin: window.location.origin,
      returnUrl: window.location.origin,
      nonce
    };

    let interval = null;
    const onMessage = event => {
      if (event.origin !== avatarMakerOrigin) return;
      const data = event.data || {};
      if (data.type === "HUBS_AUTH_ACK" && data.version === 1 && data.nonce === nonce) {
        clearInterval(interval);
        window.removeEventListener("message", onMessage);
      }
    };

    let attempts = 0;
    const maxAttempts = 10;
    interval = setInterval(() => {
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        window.removeEventListener("message", onMessage);
      } else {
        win.postMessage(payload, avatarMakerOrigin);
        attempts += 1;
      }
    }, 500);

    window.addEventListener("message", onMessage);
  };

  return (
    <Page
      showCloud={configs.feature("show_cloud")}
      enableSpoke={configs.feature("enable_spoke")}
      editorName={configs.translation("editor-name")}
      showDocsLink={configs.feature("show_docs_link")}
      docsUrl={configs.link("docs", "https://docs.hubsfoundation.org")}
      showSourceLink={configs.feature("show_source_link")}
      showCommunityLink={configs.feature("show_community_link")}
      communityUrl={configs.link("community", "https://discord.gg/dFJncWwHun")}
      isAdmin={auth.isAdmin}
      isSignedIn={auth.isSignedIn}
      email={auth.email}
      onSignOut={auth.signOut}
      onOpenAvatarMaker={openAvatarMaker}
      hidePoweredBy={configs.feature("hide_powered_by")}
      showWhatsNewLink={configs.feature("show_whats_new_link")}
      showTerms={configs.feature("show_terms")}
      termsUrl={configs.link("terms_of_use", TERMS)}
      showPrivacy={configs.feature("show_privacy")}
      privacyUrl={configs.link("privacy_notice", PRIVACY)}
      showCompanyLogo={configs.feature("show_company_logo")}
      companyLogoUrl={configs.image("company_logo")}
      showDiscordBotLink={configs.feature("show_discord_bot_link")}
      appName={configs.translation("app-name")}
      isHmc={isHmc()}
      {...rest}
    >
      {children}
    </Page>
  );
}

PageContainer.propTypes = {
  children: PropTypes.node
};
