using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AGView
{
    public class PIPInfo
    {
        public string Filename { get; set; }

        public Rectangle Rect { get; set; }

        public int ZOrder { get; set; }

        public float Alpha { get; set; }
    }
}
