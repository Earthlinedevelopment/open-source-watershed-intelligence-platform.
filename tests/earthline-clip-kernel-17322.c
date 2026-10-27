typedef unsigned int u32;
static int floor4(double y){double v=y*4.0;int i=(int)v;if(v<0.0&&v!=(double)i)i--;return i;}
static double absv(double v){return v<0.0?-v:v;}
static int point_in_edges_impl(double x,double y,const double *edges,int n){
  int inside=0;
  for(int i=0;i<n;i++){
    const double *e=edges+i*7;double x1=e[0],y1=e[1],x2=e[2],y2=e[3],dx=e[4],dy=e[5],len=e[6];
    if(len<1e-20){double ax=x-x1,ay=y-y1;if(ax*ax+ay*ay<1e-20)return 1;}
    else{double cross=(x-x1)*dy-(y-y1)*dx;if(cross<0.0)cross=-cross;if(cross<=1e-10){double dot=(x-x1)*dx+(y-y1)*dy;if(dot>=0.0&&dot<=len)return 1;}}
    if(((y2>y)!=(y1>y))&&(x<(x1-x2)*(y-y2)/((y1-y2)!=0.0?(y1-y2):1e-15)+x2))inside=!inside;
  }
  return inside;
}
__attribute__((export_name("point_in_edges"))) int point_in_edges(double x,double y,const double *edges,int n){return point_in_edges_impl(x,y,edges,n);}
static int point_in_ring_meta(double x,double y,const double *m){
  if(x<m[0]||x>m[2]||y<m[1]||y>m[3])return 0;
  int minb=(int)m[4],maxb=(int)m[5],b=floor4(y);if(b<minb||b>maxb)return 0;
  const u32 *ptrs=(const u32*)(u32)m[6],*counts=(const u32*)(u32)m[7];int idx=b-minb;u32 ptr=ptrs[idx],count=counts[idx];
  if(!ptr||!count)return 0;return point_in_edges_impl(x,y,(const double*)ptr,(int)count);
}
static int point_in_jur_impl(double x,double y,const double *ring_meta,const int *poly_meta,int poly_count){
  for(int p=0;p<poly_count;p++){
    int rs=poly_meta[p*2],rc=poly_meta[p*2+1];if(rc<1)continue;
    if(!point_in_ring_meta(x,y,ring_meta+rs*8))continue;
    int hole=0;for(int h=1;h<rc;h++)if(point_in_ring_meta(x,y,ring_meta+(rs+h)*8)){hole=1;break;}
    if(!hole)return 1;
  }return 0;
}
__attribute__((export_name("point_in_jurisdiction"))) int point_in_jurisdiction(double x,double y,const double *ring_meta,const int *poly_meta,int poly_count){return point_in_jur_impl(x,y,ring_meta,poly_meta,poly_count);}
static void boundary_point(double ax,double ay,double bx,double by,int a_inside,const double *rm,const int *pm,int pc,double *ox,double *oy){
  double inside_t=a_inside?0.0:1.0,outside_t=a_inside?1.0:0.0;
  for(int i=0;i<26;i++){double mid=(inside_t+outside_t)*0.5,x=ax+(bx-ax)*mid,y=ay+(by-ay)*mid;if(point_in_jur_impl(x,y,rm,pm,pc))inside_t=mid;else outside_t=mid;}
  *ox=ax+(bx-ax)*inside_t;*oy=ay+(by-ay)*inside_t;
}
__attribute__((export_name("clip_line")))
int clip_line(const double *raw,int n,const double *rm,const int *pm,int pc,double *out,int *offs,int *lens,int max_pts,int max_runs){
  if(n<2)return 0;int outc=0,runc=0,runstart=-1,runlen=0;
  double px=raw[0],py=raw[1];int pin=point_in_jur_impl(px,py,rm,pm,pc);
  if(pin){if(outc>=max_pts)return -1;runstart=outc;out[outc*2]=px;out[outc*2+1]=py;outc++;runlen=1;}
  for(int seg=1;seg<n;seg++){
    double ax=raw[(seg-1)*2],ay=raw[(seg-1)*2+1],bx=raw[seg*2],by=raw[seg*2+1];
    double md=absv(bx-ax);double ddy=absv(by-ay);if(ddy>md)md=ddy;double q=md/0.01;int steps=(int)q;if((double)steps<q)steps++;if(steps<1)steps=1;
    for(int k=1;k<=steps;k++){
      double t=(double)k/(double)steps,cx=ax+(bx-ax)*t,cy=ay+(by-ay)*t;int cin=point_in_jur_impl(cx,cy,rm,pm,pc);
      if(pin&&cin){if(runlen==0){if(outc>=max_pts)return -1;runstart=outc;out[outc*2]=px;out[outc*2+1]=py;outc++;runlen=1;}if(outc>=max_pts)return -1;out[outc*2]=cx;out[outc*2+1]=cy;outc++;runlen++;}
      else if(pin&&!cin){double xx,yy;boundary_point(px,py,cx,cy,1,rm,pm,pc,&xx,&yy);if(runlen==0){if(outc>=max_pts)return -1;runstart=outc;out[outc*2]=px;out[outc*2+1]=py;outc++;runlen=1;}if(outc>=max_pts)return -1;out[outc*2]=xx;out[outc*2+1]=yy;outc++;runlen++;if(runlen>=2){if(runc>=max_runs)return -1;offs[runc]=runstart;lens[runc]=runlen;runc++;}runstart=-1;runlen=0;}
      else if(!pin&&cin){double xx,yy;boundary_point(px,py,cx,cy,0,rm,pm,pc,&xx,&yy);if(outc+2>max_pts)return -1;runstart=outc;out[outc*2]=xx;out[outc*2+1]=yy;outc++;out[outc*2]=cx;out[outc*2+1]=cy;outc++;runlen=2;}
      px=cx;py=cy;pin=cin;
    }
  }
  if(runlen>=2){if(runc>=max_runs)return -1;offs[runc]=runstart;lens[runc]=runlen;runc++;}
  return runc;
}
