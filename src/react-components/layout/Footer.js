import React from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import styles from "./Footer.scss";
import { Container } from "./Container";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF } from "@fortawesome/free-brands-svg-icons/faFacebookF";
import { faInstagram } from "@fortawesome/free-brands-svg-icons/faInstagram";
import { faTwitter } from "@fortawesome/free-brands-svg-icons/faTwitter";
import { faYoutube } from "@fortawesome/free-brands-svg-icons/faYoutube";

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
                      <a className={styles.link} href="https://hubsfoundation.org">
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
                <a href="">
                  <FormattedMessage id="footer.support.explore" defaultMessage="Explore" />
                </a>
              </li>
              <li>
                <a href="">
                  <FormattedMessage id="footer.support.support" defaultMessage="Support" />
                </a>
              </li>
              <li>
                <a href="">
                  <FormattedMessage id="footer.support.gamification" defaultMessage="Gamification" />
                </a>
              </li>
              <li>
                <a href="">
                  <FormattedMessage id="footer.support.interactive" defaultMessage="Interactive Content" />
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
              <li>
                <a href="">
                  <FormattedMessage id="footer.legal.sales-limit" defaultMessage="Sales Limit" />
                </a>
              </li>
              <li>
                <a href="">
                  <FormattedMessage id="footer.legal.contact" defaultMessage="Contact" />
                </a>
              </li>
            </ul>
          </div>
          <div className={styles.column}>
            <h4>
              <FormattedMessage id="footer.social.title" defaultMessage="Social" />
            </h4>
            <div className={styles.socialIcons}>
              <a href="">
                <FontAwesomeIcon icon={faFacebookF} />
              </a>
              <a href="">
                <FontAwesomeIcon icon={faTwitter} />
              </a>
              <a href="">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
              <a href="">
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
