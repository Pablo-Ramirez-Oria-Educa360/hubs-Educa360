import React from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import styles from "./Footer.scss";
import { Container } from "./Container";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF } from "@fortawesome/free-brands-svg-icons/faFacebookF";
import { faInstagram } from "@fortawesome/free-brands-svg-icons/faInstagram";
import { faXTwitter } from "@fortawesome/free-brands-svg-icons/faXTwitter";
import { faYoutube } from "@fortawesome/free-brands-svg-icons/faYoutube";
import { faLinkedinIn } from "@fortawesome/free-brands-svg-icons/faLinkedinIn";

export function Footer({
  hidePoweredBy,
  showTerms,
  termsUrl,
  showPrivacy,
  privacyUrl,
  showCompanyLogo,
  companyLogoUrl
}) {
  return (
    <footer>
      <Container as="div" className={styles.container}>
        <div className={styles.columns}>
          <div className={styles.column}>
            <h4>
              <FormattedMessage id="footer.about.title" defaultMessage="About" />
            </h4>
            <p>
              <FormattedMessage
                id="footer.about.body"
                defaultMessage="Educa360 is an immersive environment for learning, collaboration, and educational creation."
              />
            </p>
            {!hidePoweredBy && (
              <div className={styles.poweredBy}>
                <FormattedMessage
                  id="footer.powered-by"
                  defaultMessage="Powered by <a>Hubs</a>"
                  values={{
                    a: chunks => (
                      <a
                        className={styles.link}
                        href="https://hubsfoundation.org"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {chunks}
                      </a>
                    )
                  }}
                />
              </div>
            )}
          </div>
          <div className={styles.column}>
            <h4>
              <FormattedMessage id="footer.support.title" defaultMessage="Support" />
            </h4>
            <ul>
              <li>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://content.app-sources.com/s/90759658313721701/uploads/tutoriales/Manual_Educa360_v2-6411442.pdf"
                >
                  <FormattedMessage id="footer.support.guide" defaultMessage="Guide" />
                </a>
              </li>
              <li>
                <a href="mailto:soporte@educa360.com">
                  <FormattedMessage id="footer.support.support" defaultMessage="Support" />
                </a>
              </li>
            </ul>
          </div>
          <div className={styles.column}>
            <h4>
              <FormattedMessage id="footer.legal.title" defaultMessage="Legal" />
            </h4>
            <ul>
              {showTerms && (
                <li>
                  <a target="_blank" rel="noopener noreferrer" href={termsUrl}>
                    <FormattedMessage id="footer.terms-of-use" defaultMessage="Terms of Use" />
                  </a>
                </li>
              )}
              {showPrivacy && (
                <li>
                  <a className={styles.link} target="_blank" rel="noopener noreferrer" href={privacyUrl}>
                    <FormattedMessage id="footer.privacy-notice" defaultMessage="Privacy Notice" />
                  </a>
                </li>
              )}
            </ul>
          </div>
          <div className={styles.column}>
            <h4>
              <FormattedMessage id="footer.social.title" defaultMessage="Social" />
            </h4>
            <div className={styles.socialIcons}>
              <a href="https://www.linkedin.com/company/educa360-edtech" target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faLinkedinIn} />
              </a>
              <a href="https://www.instagram.com/educa360/" target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
              <a href="https://www.facebook.com/Educa360EdTech" target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faFacebookF} />
              </a>
              <a href="https://x.com/educa360_EdTech" target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faXTwitter} />
              </a>
              <a href="https://www.youtube.com/@educa360edtech6" target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faYoutube} />
              </a>
            </div>
          </div>
        </div>
        <div className={styles.bottomBar}>
          <div className={styles.bottomLinks}>
            {showTerms && (
              <a target="_blank" rel="noopener noreferrer" href={termsUrl}>
                <FormattedMessage id="footer.terms-of-use" defaultMessage="Terms of Use" />
              </a>
            )}
            {showPrivacy && (
              <a target="_blank" rel="noopener noreferrer" href={privacyUrl}>
                <FormattedMessage id="footer.privacy-notice" defaultMessage="Privacy Notice" />
              </a>
            )}
          </div>
          {showCompanyLogo && (
            <img
              className={styles.companyLogo}
              src={companyLogoUrl}
              alt={<FormattedMessage id="footer.logo-alt" defaultMessage="Logo" />}
            />
          )}
        </div>
      </Container>
    </footer>
  );
}

Footer.propTypes = {
  hidePoweredBy: PropTypes.bool,
  showTerms: PropTypes.bool,
  termsUrl: PropTypes.string,
  showPrivacy: PropTypes.bool,
  privacyUrl: PropTypes.string,
  showCompanyLogo: PropTypes.bool,
  companyLogoUrl: PropTypes.string
};
