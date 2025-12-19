import React from 'react';
import { Layout } from 'antd';

const { Footer: AntFooter } = Layout;

const Footer = () => {
  return (
    <AntFooter className="app-footer">
      <div className="footer-content">
        <p>
          Copyright &copy; {new Date().getFullYear()} Skilledge Learning Solution. All rights reserved.
        </p>
        <p className="footer-credit">
          Created by <span className="creator-name">astaXmjy</span>
        </p>
      </div>
    </AntFooter>
  );
};

export default Footer;
