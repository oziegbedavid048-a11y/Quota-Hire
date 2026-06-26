import React from 'react';
import { CVData } from '../../../../lib/cv/types';
import { PlainTemplateBase } from './PlainTemplateBase';

export const PlainTemplate2 = ({ data }: { data: CVData }) => (
  <PlainTemplateBase 
    data={data} 
    theme={{
      primary: '#1B4F8A',
      headerAlign: 'left',
      showDividers: true,
      fontFamily: 'Times-Roman'
    }} 
  />
);
