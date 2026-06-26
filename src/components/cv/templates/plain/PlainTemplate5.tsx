import React from 'react';
import { CVData } from '../../../../lib/cv/types';
import { PlainTemplateBase } from './PlainTemplateBase';

export const PlainTemplate5 = ({ data }: { data: CVData }) => (
  <PlainTemplateBase 
    data={data} 
    theme={{
      primary: '#6B1F2E',
      headerAlign: 'center',
      showDividers: true,
      fontFamily: 'Times-Roman'
    }} 
  />
);
