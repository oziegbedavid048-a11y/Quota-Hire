import React from 'react';
import { CVData } from '../../../../lib/cv/types';
import { PlainTemplateBase } from './PlainTemplateBase';

export const PlainTemplate8 = ({ data }: { data: CVData }) => (
  <PlainTemplateBase 
    data={data} 
    theme={{
      primary: '#4A4A4A',
      headerAlign: 'left',
      showDividers: false,
      fontFamily: 'Times-Roman'
    }} 
  />
);
